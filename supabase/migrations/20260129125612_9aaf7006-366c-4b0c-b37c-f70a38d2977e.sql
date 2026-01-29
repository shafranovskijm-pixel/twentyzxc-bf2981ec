-- =============================================
-- Этап 1: Создание типов (enums)
-- =============================================

-- Тип цены
CREATE TYPE public.price_type AS ENUM ('fixed', 'negotiable', 'free');

-- Статус объявления
CREATE TYPE public.listing_status AS ENUM ('pending', 'active', 'rejected', 'archived');

-- Роли пользователей
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- Этап 2: Создание таблиц
-- =============================================

-- Таблица категорий услуг
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'Folder',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица профилей пользователей
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица ролей пользователей (отдельная для безопасности)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Таблица объявлений
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  price NUMERIC(12, 2),
  price_type public.price_type NOT NULL DEFAULT 'negotiable',
  location TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_telegram TEXT,
  images TEXT[] DEFAULT '{}',
  status public.listing_status NOT NULL DEFAULT 'active',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- =============================================
-- Этап 3: Индексы для производительности
-- =============================================

CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_category_id ON public.listings(category_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- =============================================
-- Этап 4: Триггеры для updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Этап 5: Security Definer функция для проверки ролей
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Добавляем роль user по умолчанию
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Этап 6: Генерация slug для объявлений
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Генерируем базовый slug из заголовка (транслитерация)
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Zа-яА-ЯёЁ0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := left(base_slug, 50);
  
  -- Добавляем ID для уникальности
  final_slug := base_slug || '-' || left(NEW.id::text, 8);
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_listing_slug_trigger
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_listing_slug();

-- =============================================
-- Этап 7: Включение RLS
-- =============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Этап 8: RLS политики для categories
-- =============================================

-- Все могут читать категории
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories
  FOR SELECT
  USING (true);

-- Только админы могут управлять категориями
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Этап 9: RLS политики для profiles
-- =============================================

-- Все могут читать профили
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================
-- Этап 10: RLS политики для user_roles
-- =============================================

-- Только через security definer функции (никакого прямого доступа)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Этап 11: RLS политики для listings
-- =============================================

-- Все могут читать активные объявления
CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings
  FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Авторизованные пользователи могут создавать объявления
CREATE POLICY "Authenticated users can create listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Владелец или админ могут обновлять объявления
CREATE POLICY "Owners and admins can update listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Владелец или админ могут удалять объявления
CREATE POLICY "Owners and admins can delete listings"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Этап 12: Начальные категории
-- =============================================

INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
  ('Недвижимость', 'nedvizhimost', 'Home', 'Покупка, продажа, аренда недвижимости', 1),
  ('Авто и транспорт', 'avto', 'Car', 'Автомобили, мотоциклы, спецтехника', 2),
  ('Работа и вакансии', 'rabota', 'Briefcase', 'Вакансии и резюме', 3),
  ('Услуги', 'uslugi', 'Wrench', 'Бытовые и профессиональные услуги', 4),
  ('Электроника', 'elektronika', 'Smartphone', 'Телефоны, компьютеры, техника', 5),
  ('Дом и сад', 'dom-i-sad', 'Flower2', 'Мебель, ремонт, садоводство', 6),
  ('Одежда и обувь', 'odezhda', 'Shirt', 'Мужская, женская, детская одежда', 7),
  ('Образование', 'obrazovanie', 'GraduationCap', 'Курсы, репетиторы, обучение', 8),
  ('IT и Digital', 'it-digital', 'Code', 'Веб-разработка, дизайн, маркетинг', 9),
  ('Красота и здоровье', 'krasota', 'Heart', 'Салоны красоты, медицина, спорт', 10),
  ('Транспорт и логистика', 'logistika', 'Truck', 'Перевозки, доставка, склады', 11),
  ('Мероприятия', 'meropriyatiya', 'PartyPopper', 'Праздники, свадьбы, концерты', 12),
  ('Домашний персонал', 'personal', 'Users', 'Няни, сиделки, домработницы', 13),
  ('Финансовые услуги', 'finansy', 'Wallet', 'Кредиты, страхование, инвестиции', 14),
  ('Юридические услуги', 'yuridicheskie', 'Scale', 'Консультации, документы, суды', 15),
  ('Путешествия', 'puteshestviya', 'Plane', 'Туры, билеты, отели', 16);

-- =============================================
-- Этап 13: Storage buckets для изображений
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('listing-images', 'listing-images', true),
  ('avatars', 'avatars', true);

-- Политики для listing-images
CREATE POLICY "Listing images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Users can update own listing images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own listing images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политики для avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);