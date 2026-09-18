CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'Nova conversa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_updated
ON public.chat_threads(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
ON public.chat_messages(thread_id, created_at ASC);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat threads"
ON public.chat_threads FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their own threads"
ON public.chat_messages FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE public.chat_threads.id = public.chat_messages.thread_id
      AND public.chat_threads.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE public.chat_threads.id = public.chat_messages.thread_id
      AND public.chat_threads.user_id = auth.uid()
));