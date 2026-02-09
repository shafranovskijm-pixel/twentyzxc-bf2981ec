
-- Create storage bucket for playground images
INSERT INTO storage.buckets (id, name, public)
VALUES ('playground-images', 'playground-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload images (playground is public)
CREATE POLICY "Anyone can upload playground images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'playground-images');

-- Public read access
CREATE POLICY "Playground images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'playground-images');

-- Allow deletion by uploader or admin
CREATE POLICY "Anyone can delete own playground images"
ON storage.objects FOR DELETE
USING (bucket_id = 'playground-images');
