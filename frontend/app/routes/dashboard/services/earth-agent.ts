import axios from "axios";
import { api } from "~/lib/api";

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type AgentThread = {
  id: string;
  title: string;
  updated_at: string;
};

export const welcomeMessage: AgentMessage = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Olá! Sou o **Earth Agent**, seu especialista em manejo de irrigação. Como posso ajudar você a interpretar as leituras do seu solo?",
  created_at: new Date(0).toISOString(),
};

export function getAgentErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message.length > 0) return message;
  }

  return fallback;
}

export async function listAgentThreads(): Promise<AgentThread[]> {
  const response = await api.get<{ threads: AgentThread[] }>("/ai/threads");
  return response.data.threads ?? [];
}

export async function getAgentThreadMessages(threadId: string): Promise<AgentMessage[]> {
  const response = await api.get<{ messages: AgentMessage[] }>(`/ai/threads/${threadId}/messages`);
  return response.data.messages ?? [];
}

export async function deleteAgentThread(threadId: string): Promise<void> {
  await api.delete(`/ai/threads/${threadId}`);
}

export async function sendAgentMessage(message: string, threadId?: string) {
  const response = await api.post<{
    thread_id: string;
    messages: AgentMessage[];
  }>("/ai/chat", { message, thread_id: threadId });

  return response.data;
}
