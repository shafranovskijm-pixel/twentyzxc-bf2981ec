-- Restrict telegram_chat_id from anonymous access on playground_projects
REVOKE SELECT ON public.playground_projects FROM anon;
GRANT SELECT (id, slug, title, author_name, blocks, settings, created_at, updated_at, is_featured, preview_image) 
  ON public.playground_projects TO anon;
