INSERT INTO storage.buckets (id, name, public) VALUES ('admin-assets', 'admin-assets', true);

CREATE POLICY "Admin assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-assets');

CREATE POLICY "Admins can upload admin assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));