-- Create template-images bucket for storing AI-generated template images
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for public read access
CREATE POLICY "Template images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-images');

-- Allow edge functions to upload images (service role)
CREATE POLICY "Service role can upload template images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-images');

CREATE POLICY "Service role can update template images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-images');

CREATE POLICY "Service role can delete template images"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-images');