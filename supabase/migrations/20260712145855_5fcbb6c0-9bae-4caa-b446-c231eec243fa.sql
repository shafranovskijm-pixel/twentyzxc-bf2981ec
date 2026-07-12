CREATE TABLE public.user_ui_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_sidebar_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  sidebar_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ui_settings TO authenticated;
GRANT ALL ON public.user_ui_settings TO service_role;
ALTER TABLE public.user_ui_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ui settings" ON public.user_ui_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);