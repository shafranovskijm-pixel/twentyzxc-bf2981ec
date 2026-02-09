-- Таблица настроек портфолио
CREATE TABLE public.portfolio_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  featured_title TEXT NOT NULL DEFAULT 'Избранные проекты',
  all_title TEXT NOT NULL DEFAULT 'Все проекты',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Вставляем начальные значения
INSERT INTO public.portfolio_settings (id, featured_title, all_title) 
VALUES ('main', 'Избранные проекты', 'Все проекты');

-- Enable RLS
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

-- Все могут читать
CREATE POLICY "Portfolio settings are viewable by everyone"
ON public.portfolio_settings
FOR SELECT
USING (true);

-- Только админы могут редактировать
CREATE POLICY "Admins can update portfolio settings"
ON public.portfolio_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));