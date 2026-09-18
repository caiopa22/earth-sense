import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Circle,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { EarthAgentMarkdown } from "../components/EarthAgentMarkdown";
import {
  deleteAgentThread,
  getAgentErrorMessage,
  getAgentThreadMessages,
  listAgentThreads,
  sendAgentMessage,
  welcomeMessage,
  type AgentMessage,
  type AgentThread,
} from "../services/earth-agent";

const suggestions = [
  "Analise meus sensores",
  "Qual a umidade atual?",
  "Existe risco para minha plantação?",
];

export function EarthAgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [threadId, setThreadId] = useState<string>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string>();
  const [threadToDelete, setThreadToDelete] = useState<AgentThread | null>(null);
  const [error, setError] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    let active = true;

    async function loadAgent() {
      try {
        const availableThreads = await listAgentThreads();
        const latestThread = availableThreads[0];

        if (active) setThreads(availableThreads);

        if (latestThread) {
          const threadMessages = await getAgentThreadMessages(latestThread.id);
          if (active) {
            setThreadId(latestThread.id);
            setMessages([welcomeMessage, ...threadMessages]);
          }
        } else {
          if (active) {
            setMessages([welcomeMessage]);
          }
        }
      } catch (requestError) {
        if (active) {
          const apiMessage = getAgentErrorMessage(
            requestError,
            "Não foi possível carregar suas conversas.",
          );
          setMessages([welcomeMessage]);
          setError(apiMessage);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAgent();
    return () => {
      active = false;
    };
  }, []);

  async function openThread(nextThreadId: string) {
    if (isSending || nextThreadId === threadId) return;

    setIsLoading(true);
    setMessages([]);
    setError(undefined);
    try {
      const nextMessages = await getAgentThreadMessages(nextThreadId);
      setThreadId(nextThreadId);
      setMessages([welcomeMessage, ...nextMessages]);
    } catch (requestError) {
      setError(getAgentErrorMessage(requestError, "Não foi possível carregar esta conversa."));
    } finally {
      setIsLoading(false);
    }
  }

  function startNewThread() {
    if (isSending) return;
    setThreadId(undefined);
    setMessages([welcomeMessage]);
    setError(undefined);
  }

  function requestThreadDeletion(thread: AgentThread) {
    if (isSending || deletingThreadId) return;
    setThreadToDelete(thread);
  }

  async function confirmThreadDeletion() {
    if (!threadToDelete) return;

    const nextThreadId = threadToDelete.id;
    setThreadToDelete(null);
    setDeletingThreadId(nextThreadId);
    setError(undefined);

    try {
      await deleteAgentThread(nextThreadId);
      setThreads((current) => current.filter((thread) => thread.id !== nextThreadId));

      if (threadId === nextThreadId) {
        setThreadId(undefined);
        setMessages([welcomeMessage]);
      }
    } catch (requestError) {
      setError(getAgentErrorMessage(requestError, "Não foi possível excluir esta conversa."));
    } finally {
      setDeletingThreadId(undefined);
    }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    setError(undefined);
    setIsSending(true);
    const optimistic: AgentMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const response = await sendAgentMessage(content, threadId);
      setThreadId(response.thread_id);
      setThreads((current) => {
        const existing = current.find((thread) => thread.id === response.thread_id);
        const nextThread = existing ?? {
          id: response.thread_id,
          title: content.slice(0, 80),
          updated_at: new Date().toISOString(),
        };
        return [nextThread, ...current.filter((thread) => thread.id !== nextThread.id)];
      });
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimistic.id),
        ...response.messages,
      ]);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setError(
        getAgentErrorMessage(
          requestError,
          "Não foi possível enviar sua mensagem. Tente novamente.",
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl gap-4 p-3 sm:gap-6 sm:p-6">
      <aside className="hidden w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/45 md:flex">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Conversas
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">Histórico do Earth Agent</p>
          </div>
          <Sparkles className="size-4 text-primary" />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mx-3 mt-3 w-[calc(100%-1.5rem)] justify-start gap-2 rounded-xl border border-dashed border-primary/35 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={startNewThread}
        >
          <MessageSquarePlus className="size-4" /> Nova conversa
        </Button>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 pt-2">
          {threads.length === 0 && (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground/70">
              Suas conversas aparecerão aqui.
            </p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`flex w-full items-center gap-1 rounded-xl border text-xs transition-colors ${thread.id === threadId ? "border-primary/20 bg-primary/10 font-medium text-primary" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
            >
              <button
                type="button"
                onClick={() => openThread(thread.id)}
                className="min-w-0 flex-1 truncate px-3 py-2.5 text-left"
              >
                {thread.title}
              </button>
              <button
                type="button"
                title="Excluir conversa"
                aria-label={`Excluir conversa ${thread.title}`}
                onClick={() => requestThreadDeletion(thread)}
                disabled={deletingThreadId === thread.id}
                className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {deletingThreadId === thread.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="mx-auto flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/25 shadow-sm">
        <header className="flex items-center gap-3 border-b border-border/60 bg-card/35 px-4 py-4 sm:px-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm shadow-primary/10">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
                Earth Agent
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary sm:flex">
                <Circle className="size-1.5 fill-current" /> Online
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Especialista em manejo de irrigação
            </p>
          </div>
        </header>

        <section className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-8">
          {isLoading ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 className="size-4 animate-spin" />
              </div>
              <span className="text-xs">Preparando sua conversa...</span>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[min(88%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === "user" ? "whitespace-pre-wrap rounded-br-md bg-primary text-primary-foreground shadow-primary/10" : "rounded-bl-md border border-border/60 bg-card"}`}
                >
                  {message.role === "assistant" ? (
                    <EarthAgentMarkdown content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-primary">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Earth Agent está pensando...
            </div>
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </section>

        {error && <p className="mx-4 text-sm text-destructive sm:mx-6">{error}</p>}
        <div className="flex flex-wrap gap-2 border-t border-border/60 bg-card/35 px-4 pb-4 pt-4 sm:px-6">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(suggestion);
              }}
              disabled={isSending}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <form
          onSubmit={sendMessage}
          className="mx-4 mb-4 mt-1 flex items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 sm:mx-6"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pergunte algo sobre seu solo..."
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensagem"
            disabled={!input.trim() || isSending}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      <AlertDialog
        open={Boolean(threadToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingThreadId) setThreadToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A conversa “{threadToDelete?.title}” e todas as suas mensagens serão removidas. Essa
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingThreadId)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmThreadDeletion}
              disabled={Boolean(deletingThreadId)}
            >
              Excluir conversa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
