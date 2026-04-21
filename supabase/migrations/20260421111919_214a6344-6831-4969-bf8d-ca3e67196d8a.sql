
-- Remove broad public SELECT from organizations (kept owner/admin policies)
DROP POLICY IF EXISTS "Public can read published org rows" ON public.organizations;

-- Remove broad public SELECT from listings (kept owner/staff policy)
DROP POLICY IF EXISTS "Public can read active listing rows" ON public.listings;

-- Recreate views as SECURITY DEFINER so anonymous users can read them
-- without having direct SELECT on the base tables
DROP VIEW IF EXISTS public.organizations_public;
DROP VIEW IF EXISTS public.listings_public;

-- Use SECURITY DEFINER functions instead of views for safe public access
CREATE OR REPLACE FUNCTION public.get_org_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  landing_slug text,
  landing_config jsonb,
  logo_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, landing_slug, landing_config, logo_url, created_at, updated_at
  FROM public.organizations
  WHERE landing_slug = _slug
$$;

GRANT EXECUTE ON FUNCTION public.get_org_by_slug(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_active_listings()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category_id uuid,
  title text,
  slug text,
  description text,
  price numeric,
  price_type price_type,
  location text,
  images text[],
  status listing_status,
  views_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, category_id, title, slug, description, price, price_type,
         location, images, status, views_count, created_at, updated_at, expires_at
  FROM public.listings
  WHERE status = 'active'::listing_status
$$;

GRANT EXECUTE ON FUNCTION public.get_active_listings() TO anon, authenticated;
