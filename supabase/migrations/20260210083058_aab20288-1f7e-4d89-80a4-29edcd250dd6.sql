
-- Revoke direct SELECT on contact columns from anon and authenticated roles
-- Then re-grant only non-sensitive columns
-- Using column-level GRANT approach

-- First revoke all SELECT on listings from anon
REVOKE SELECT ON public.listings FROM anon;

-- Grant SELECT on non-sensitive columns only to anon
GRANT SELECT (id, user_id, category_id, title, slug, description, price, price_type, location, images, status, views_count, created_at, updated_at, expires_at) ON public.listings TO anon;
