import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { Router } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/http.js';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';

type SoilStatus = 'dry' | 'low' | 'optimal' | 'high' | 'saturated';

function classifySoil(humidity: number): SoilStatus {
  if (humidity < 20) return 'dry';
  if (humidity < 40) return 'low';
  if (humidity < 70) return 'optimal';
  if (humidity < 85) return 'high';
  return 'saturated';
}

async function getSoilContext(userId: string, deviceId?: string) {
  let devicesQuery = supabaseAdmin.from('devices').select('id, name, location').eq('user_id', userId);

  if (deviceId) {
    devicesQuery = devicesQuery.eq('id', deviceId);
  }

  const { data: devices, error: devicesError } = await devicesQuery;

  if (devicesError) throw new Error(devicesError.message);

  const deviceIds = (devices ?? []).map((device) => device.id);

  if (deviceIds.length === 0) {
    return { devices: [], readings: [] };
  }

  const { data: readings, error: readingsError } = await supabaseAdmin
    .from('soil_readings')
    .select('id, device_id, humidity_pct, raw_value, sampled_at, created_at')
    .in('device_id', deviceIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (readingsError) throw new Error(readingsError.message);

  return { devices: devices ?? [], readings: readings ?? [] };
}

function buildContext(context: Awaited<ReturnType<typeof getSoilContext>>) {
  return context.readings.map((reading) => {
    const device = context.devices.find((item) => item.id === reading.device_id);
    return {
      device: device?.name ?? reading.device_id,
      location: device?.location ?? null,
      humidity_pct: Number(reading.humidity_pct),
      soil_status: classifySoil(Number(reading.humidity_pct)),
      raw_value: reading.raw_value,
      timestamp: reading.sampled_at ?? reading.created_at,
    };
  });
}

async function generateAgentResponse(instruction: string, context: ReturnType<typeof buildContext>) {
  if (!ai) {
    return 'O Earth Agent está sem uma chave de API configurada. Ainda posso mostrar a classificação calculada a partir das leituras.';
  }

  const response = await ai.models.generateContent({
    model,
    config: {
      maxOutputTokens: 180,
    },
    contents: [
      {
        role: 'user',
        parts: [{
          text: `Você é o Earth Agent, especialista em manejo de irrigação. Responda em português claro e de forma muito breve: use no máximo 2 a 4 frases curtas ou 3 tópicos. Use somente o contexto fornecido, deixe explícito quando não houver leituras suficientes e não prescreva irrigação automática.\n\nContexto das leituras:\n${JSON.stringify(context)}\n\nSolicitação:\n${instruction}`,
        }],
      },
    ],
  });

  return response.text?.trim() || 'Não foi possível gerar uma análise agora.';
}

router.use(requireAuth);

router.get('/hello', async (_req, res) => {
  if (!ai) {
    return sendError(res, 500, 'GEMINI_API_KEY is not configured.');
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: 'First message to Google GenAI! Respond with a very short greeting.',
    });

    const text = typeof response?.text === 'string' ? response.text.trim() : 'oi';

    return res.json({
      message: text || 'oi',
      provider: 'google-genai',
    });
  } catch (error) {
    console.error('Google GenAI error:', error);
    return sendError(res, 500, 'Failed to call Google GenAI.');
  }
});

router.post('/analyze', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const deviceId = typeof req.body?.device_id === 'string' ? req.body.device_id : undefined;

  if (!userId) return sendError(res, 401, 'Authentication required.');

  try {
    const context = await getSoilContext(userId, deviceId);
    const readings = buildContext(context);
    const latestByDevice = context.devices.map((device) => {
      const latest = readings.find((reading) => reading.device === device.name);
      return latest ? { ...latest } : { device: device.name, location: device.location, soil_status: null };
    });
    const analysis = await generateAgentResponse('Analise o estado atual dos dispositivos, destaque riscos e dê recomendações de irrigação.', readings);

    return res.json({ analysis, readings: latestByDevice, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Earth Agent analysis error:', error);
    return sendError(res, 500, 'Unable to generate soil analysis.');
  }
});

router.get('/threads', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Authentication required.');

  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return sendError(res, 500, error.message);
  return res.json({ threads: data ?? [] });
});

router.get('/threads/:threadId/messages', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Authentication required.');

  const { data: thread } = await supabaseAdmin
    .from('chat_threads')
    .select('id')
    .eq('id', req.params.threadId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!thread) return sendError(res, 404, 'Thread not found.');

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  if (error) return sendError(res, 500, error.message);
  return res.json({ messages: data ?? [] });
});

router.delete('/threads/:threadId', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Authentication required.');

  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .delete()
    .eq('id', req.params.threadId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) return sendError(res, 500, error.message);
  if (!data) return sendError(res, 404, 'Thread not found.');

  return res.json({ message: 'Thread deleted successfully.', thread_id: data.id });
});

router.post('/chat', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const requestedThreadId = typeof req.body?.thread_id === 'string' ? req.body.thread_id : undefined;
  const deviceId = typeof req.body?.device_id === 'string' ? req.body.device_id : undefined;

  if (!userId) return sendError(res, 401, 'Authentication required.');
  if (!message) return sendError(res, 400, 'Message is required.');
  if (message.length > 4000) return sendError(res, 400, 'Message is too long.');

  try {
    let threadId = requestedThreadId;
    if (threadId) {
      const { data: thread } = await supabaseAdmin.from('chat_threads').select('id').eq('id', threadId).eq('user_id', userId).maybeSingle();
      if (!thread) return sendError(res, 404, 'Thread not found.');
    } else {
      const { data: thread, error } = await supabaseAdmin.from('chat_threads').insert({ user_id: userId, title: message.slice(0, 80) }).select('id').single();
      if (error || !thread) return sendError(res, 500, error?.message ?? 'Unable to create thread.');
      threadId = thread.id;
    }

    const context = buildContext(await getSoilContext(userId, deviceId));
    const { data: userMessage, error: userMessageError } = await supabaseAdmin.from('chat_messages').insert({ thread_id: threadId, role: 'user', content: message }).select('id, role, content, created_at').single();
    if (userMessageError) return sendError(res, 500, userMessageError.message);

    const answer = await generateAgentResponse(message, context);
    const { data: assistantMessage, error: assistantError } = await supabaseAdmin.from('chat_messages').insert({ thread_id: threadId, role: 'assistant', content: answer }).select('id, role, content, created_at').single();
    if (assistantError) return sendError(res, 500, assistantError.message);

    await supabaseAdmin.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
    return res.json({ thread_id: threadId, messages: [userMessage, assistantMessage] });
  } catch (error) {
    console.error('Earth Agent chat error:', error);
    const message = error instanceof Error ? error.message : 'Unable to process Earth Agent message.';
    return sendError(res, 500, message);
  }
});

export default router;