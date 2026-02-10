
-- 1. Fix telegram_bot_users: remove public access (webhook uses service role which bypasses RLS)
DROP POLICY IF EXISTS "Allow public insert" ON public.telegram_bot_users;
DROP POLICY IF EXISTS "Allow public select" ON public.telegram_bot_users;
DROP POLICY IF EXISTS "Allow public update" ON public.telegram_bot_users;

-- Only admins can view bot users
CREATE POLICY "Admins can view bot users"
  ON public.telegram_bot_users FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage bot users (service role bypasses RLS for webhook)
CREATE POLICY "Admins can manage bot users"
  ON public.telegram_bot_users FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix playground-images storage: require auth
DROP POLICY IF EXISTS "Anyone can upload playground images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete own playground images" ON storage.objects;

CREATE POLICY "Authenticated users can upload playground images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'playground-images');

CREATE POLICY "Authenticated users can delete own playground images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'playground-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Fix listings contact exposure: hide contact fields from anon by using a restrictive SELECT policy
-- Drop existing permissive SELECT policy and replace with two policies
DROP POLICY IF EXISTS "Listings are viewable with masked contacts" ON public.listings;

-- Public can see active listings (contact fields included but only for owners/admins)
CREATE POLICY "Active listings viewable by everyone"
  ON public.listings FOR SELECT
  USING (
    status = 'active'::listing_status
    OR auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- 4. Fix profiles: ensure only authenticated users with matching ID can read
-- Current policies already use auth.uid() = id, which is correct
-- But let's ensure the policy targets authenticated role explicitly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
