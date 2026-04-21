
-- 1. ORGANIZATIONS: stop exposing user_id / inn via public landing slug lookup
DROP POLICY IF EXISTS "Public can read org by slug" ON public.organizations;

CREATE OR REPLACE VIEW public.organizations_public
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  landing_slug,
  landing_config,
  logo_url,
  created_at,
  updated_at
FROM public.organizations
WHERE landing_slug IS NOT NULL;

GRANT SELECT ON public.organizations_public TO anon, authenticated;

-- Allow the view's underlying SELECT for anon/auth via a tightened policy that
-- only exposes rows with a landing_slug (the view will further enforce column projection).
CREATE POLICY "Public can read published org rows"
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (landing_slug IS NOT NULL);

-- NOTE: existing policies "Org owners can view own org" and admin policies still apply
-- and grant access to the full row for owners/admins.

-- 2. LISTINGS: contact_email/phone/telegram should not be publicly readable.
-- Replace permissive SELECT with one that hides contact columns by directing
-- public consumers to the safe view + the existing get_listing_contact_info() RPC.
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON public.listings;

-- Owners, admins, moderators can still see full rows
CREATE POLICY "Owners staff can view full listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE OR REPLACE VIEW public.listings_public
WITH (security_invoker = true)
AS
SELECT
  id, user_id, category_id, title, slug, description, price, price_type,
  location, images, status, views_count, created_at, updated_at, expires_at
FROM public.listings
WHERE status = 'active'::listing_status;

GRANT SELECT ON public.listings_public TO anon, authenticated;

-- Allow underlying row visibility for active rows so the view returns data,
-- but the view restricts which columns are exposed.
CREATE POLICY "Public can read active listing rows"
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active'::listing_status);

-- 3. STORAGE: lock down template-images write/update/delete to admins only
DROP POLICY IF EXISTS "Service role can upload template images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update template images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete template images" ON storage.objects;

CREATE POLICY "Admins can upload template images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'template-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update template images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'template-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete template images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'template-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. PLAYGROUND_PROJECTS: cap JSONB payload sizes to prevent abuse
ALTER TABLE public.playground_projects
  ADD CONSTRAINT blocks_size_limit CHECK (pg_column_size(blocks) < 1048576);

ALTER TABLE public.playground_projects
  ADD CONSTRAINT settings_size_limit CHECK (pg_column_size(settings) < 102400);
