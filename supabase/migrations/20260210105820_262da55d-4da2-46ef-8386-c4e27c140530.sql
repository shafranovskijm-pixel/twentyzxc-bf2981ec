
-- Re-add public SELECT for site_settings (it contains public config needed by the website)
-- The data (contact info, social links) is intentionally public
CREATE POLICY "Site settings readable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

-- Drop the authenticated-only policy since we need public access
DROP POLICY IF EXISTS "Site settings readable by authenticated" ON public.site_settings;
