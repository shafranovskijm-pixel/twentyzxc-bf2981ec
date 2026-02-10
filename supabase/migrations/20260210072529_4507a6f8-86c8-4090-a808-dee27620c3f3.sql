
-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);
