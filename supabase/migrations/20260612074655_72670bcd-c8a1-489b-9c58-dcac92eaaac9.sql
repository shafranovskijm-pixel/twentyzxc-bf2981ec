
CREATE TABLE public.email_campaign_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  error text,
  sent_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaign_queue TO authenticated;
GRANT ALL ON public.email_campaign_queue TO service_role;

ALTER TABLE public.email_campaign_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own queue" ON public.email_campaign_queue
  FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE INDEX idx_ecq_status_scheduled ON public.email_campaign_queue (status, scheduled_at);
CREATE INDEX idx_ecq_created_by ON public.email_campaign_queue (created_by, scheduled_at DESC);

CREATE TRIGGER ecq_updated_at
  BEFORE UPDATE ON public.email_campaign_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
