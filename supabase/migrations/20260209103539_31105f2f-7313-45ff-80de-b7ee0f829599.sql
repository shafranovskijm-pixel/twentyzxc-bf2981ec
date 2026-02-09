-- Add columns for gallery functionality
ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_image TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Аноним';