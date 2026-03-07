INSERT INTO storage.buckets (id, name, public)
VALUES ('document-assets', 'document-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read document assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-assets');

CREATE POLICY "Admins can manage document assets"
ON storage.objects FOR ALL
USING (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));