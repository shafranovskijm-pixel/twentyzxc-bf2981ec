-- Таблица проектов портфолио
CREATE TABLE public.portfolio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  price TEXT,
  price_alt TEXT,
  url TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Проекты видны всем
CREATE POLICY "Portfolio projects are viewable by everyone"
ON public.portfolio_projects
FOR SELECT
USING (true);

-- Только админы могут добавлять
CREATE POLICY "Admins can insert portfolio projects"
ON public.portfolio_projects
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Только админы могут редактировать
CREATE POLICY "Admins can update portfolio projects"
ON public.portfolio_projects
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Только админы могут удалять
CREATE POLICY "Admins can delete portfolio projects"
ON public.portfolio_projects
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Триггер для обновления updated_at
CREATE TRIGGER update_portfolio_projects_updated_at
BEFORE UPDATE ON public.portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();