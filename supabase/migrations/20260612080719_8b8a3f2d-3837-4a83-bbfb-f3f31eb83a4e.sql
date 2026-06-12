-- Hard dedup: one active queue entry per email address per user
CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_queue_active_email_uniq
  ON public.email_campaign_queue (created_by, lower(email))
  WHERE status IN ('queued','sending','sent');