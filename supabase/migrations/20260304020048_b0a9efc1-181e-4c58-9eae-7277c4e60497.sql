
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price text,
  old_price text,
  badge text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
