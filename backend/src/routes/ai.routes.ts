import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { Router } from 'express';
import { sendError } from '../utils/http.js';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

router.get('/hello', async (_req, res) => {
  if (!ai) {
    return sendError(res, 500, 'GEMINI_API_KEY is not configured.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
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

export default router;