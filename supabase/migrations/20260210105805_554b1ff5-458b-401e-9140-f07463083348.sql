
-- 1. Hide telegram_chat_id from public SELECT on playground_projects
-- Create a view excluding sensitive fields
CREATE VIEW public.playground_projects_public
WITH (security_invoker = on) AS
  SELECT id, slug, title, author_name, blocks, settings, created_at, updated_at, is_featured, preview_image
  FROM public.playground_projects;

-- 2. Add size constraints on playground_projects to prevent abuse
ALTER TABLE public.playground_projects
  ADD CONSTRAINT slug_length CHECK (length(slug) <= 100);

ALTER TABLE public.playground_projects
  ADD CONSTRAINT title_length CHECK (length(title) <= 200);

-- 3. Restrict site_settings SELECT to authenticated users only
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Site settings readable by everyone" ON public.site_settings;

-- Create new policy: only authenticated users can read
CREATE POLICY "Site settings readable by authenticated"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);
