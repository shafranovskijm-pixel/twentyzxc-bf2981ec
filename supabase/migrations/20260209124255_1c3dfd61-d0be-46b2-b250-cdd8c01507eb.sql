
-- Разрешить админам удалять проекты из playground
CREATE POLICY "Admins can delete playground projects"
ON public.playground_projects FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Разрешить админам обновлять проекты
CREATE POLICY "Admins can update playground projects"
ON public.playground_projects FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Таблица предложений
CREATE TABLE public.playground_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playground_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback"
ON public.playground_feedback FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert feedback"
ON public.playground_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
ON public.playground_feedback FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any feedback"
ON public.playground_feedback FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
