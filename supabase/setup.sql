-- «Север помнит»: база клиентов и личные кабинеты.
-- Выполнить целиком в Supabase → SQL Editor → New query → Run. Можно запускать повторно.

-- 1. Роли (мастер) — отдельная таблица, чтобы клиент не мог назначить себя мастером
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('master'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own roles" ON public.user_roles;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_master() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master')
$$;
GRANT EXECUTE ON FUNCTION public.is_master() TO authenticated;

-- 2. Профили клиентов
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  telegram text NOT NULL DEFAULT '',
  oil text NOT NULL DEFAULT '',
  tea text NOT NULL DEFAULT '',
  pressure text NOT NULL DEFAULT '',
  silence boolean NOT NULL DEFAULT false,
  wishes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile read" ON public.profiles;
DROP POLICY IF EXISTS "profile insert" ON public.profiles;
DROP POLICY IF EXISTS "profile update" ON public.profiles;
CREATE POLICY "profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_master());
CREATE POLICY "profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_master());

-- профиль создаётся сам при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name',''), coalesce(NEW.raw_user_meta_data->>'phone',''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Абонементы и депозиты (меняет только мастер)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_sessions int NOT NULL DEFAULT 0 CHECK (total_sessions >= 0),
  used_sessions int NOT NULL DEFAULT 0 CHECK (used_sessions >= 0 AND used_sessions <= total_sessions),
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subs read" ON public.subscriptions;
DROP POLICY IF EXISTS "subs master" ON public.subscriptions;
CREATE POLICY "subs read" ON public.subscriptions FOR SELECT TO authenticated USING (client_id = auth.uid() OR public.is_master());
CREATE POLICY "subs master" ON public.subscriptions FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master());

-- 4. История визитов (пишет только мастер)
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visited_on date NOT NULL DEFAULT current_date,
  service text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visits read" ON public.visits;
DROP POLICY IF EXISTS "visits master" ON public.visits;
CREATE POLICY "visits read" ON public.visits FOR SELECT TO authenticated USING (client_id = auth.uid() OR public.is_master());
CREATE POLICY "visits master" ON public.visits FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master());

-- 5. Закрытые заметки мастера (клиент их не видит)
CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT ALL ON public.client_notes TO service_role;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes master" ON public.client_notes;
CREATE POLICY "notes master" ON public.client_notes FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master());

-- 6. Списать сеанс и записать визит одним действием
CREATE OR REPLACE FUNCTION public.use_session(_sub uuid, _service text DEFAULT '') RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.subscriptions;
BEGIN
  IF NOT public.is_master() THEN RAISE EXCEPTION 'only master'; END IF;
  SELECT * INTO s FROM public.subscriptions WHERE id = _sub FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF s.used_sessions >= s.total_sessions THEN RAISE EXCEPTION 'no sessions left'; END IF;
  UPDATE public.subscriptions SET used_sessions = used_sessions + 1 WHERE id = _sub;
  INSERT INTO public.visits (client_id, service) VALUES (s.client_id, coalesce(nullif(_service,''), s.title));
  RETURN s.total_sessions - s.used_sessions - 1;
END $$;
GRANT EXECUTE ON FUNCTION public.use_session(uuid, text) TO authenticated;

-- 7. ПОСЛЕ того как Александра зарегистрируется на сайте, выполните отдельно
--    (подставьте её почту), чтобы открыть ей картотеку:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'master' FROM auth.users WHERE email = 'почта-александры@example.com'
-- ON CONFLICT DO NOTHING;
