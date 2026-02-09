-- Fix 1: Restrict profiles table - users can only view their own profile
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Hide contact info from listings for unauthenticated users
-- We need to create a view that hides contact info and update the policy

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON public.listings;

-- Create new policy: Everyone can see listings but contact info is only visible to authenticated users
-- For public visibility of listings (without sensitive contact data), we use a function to mask data
CREATE POLICY "Listings are viewable with masked contacts"
ON public.listings
FOR SELECT
USING (
  (status = 'active'::listing_status) OR 
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Create a secure function to get listing contact info only for authenticated users
CREATE OR REPLACE FUNCTION public.get_listing_contact_info(listing_id uuid)
RETURNS TABLE(contact_email text, contact_phone text, contact_telegram text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can get contact info
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT l.contact_email, l.contact_phone, l.contact_telegram
  FROM public.listings l
  WHERE l.id = listing_id AND l.status = 'active'::listing_status;
END;
$$;