
CREATE TABLE public.telegram_bot_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_bot_users ENABLE ROW LEVEL SECURITY;

-- Webhook needs to insert/upsert users without auth
CREATE POLICY "Allow public insert" ON public.telegram_bot_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.telegram_bot_users
  FOR SELECT USING (true);

-- Updates handled by service role in edge function, but allow public update for webhook /stop
CREATE POLICY "Allow public update" ON public.telegram_bot_users
  FOR UPDATE USING (true);
