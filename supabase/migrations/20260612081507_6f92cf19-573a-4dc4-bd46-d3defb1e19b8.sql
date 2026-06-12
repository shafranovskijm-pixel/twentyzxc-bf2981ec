DROP TRIGGER IF EXISTS email_campaign_queue_set_updated_at ON public.email_campaign_queue;
CREATE TRIGGER email_campaign_queue_set_updated_at
BEFORE UPDATE ON public.email_campaign_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();