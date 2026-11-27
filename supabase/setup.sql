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

-- 8. Оповещения Александре в Telegram о новых регистрациях
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bot_token text NOT NULL DEFAULT '',
  chat_id text NOT NULL DEFAULT ''
);
REVOKE ALL ON public.bot_settings FROM anon, authenticated;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.bot_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_master(_text text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bot_settings;
BEGIN
  SELECT * INTO b FROM public.bot_settings WHERE id = 1;
  IF b.bot_token = '' OR b.chat_id = '' THEN RETURN; END IF;
  PERFORM net.http_post(
    url := 'https://api.telegram.org/bot' || b.bot_token || '/sendMessage',
    body := jsonb_build_object('chat_id', b.chat_id, 'text', _text),
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_master(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.on_new_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_master('🌿 Новый клиент в кабинете: ' || coalesce(nullif(NEW.full_name,''),'без имени')
    || coalesce(' · ' || nullif(NEW.phone,''), ''));
  RETURN NEW;
EXCEPTION WHEN others THEN RETURN NEW; -- оповещение не должно мешать регистрации
END $$;
DROP TRIGGER IF EXISTS profile_notify ON public.profiles;
CREATE TRIGGER profile_notify AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.on_new_profile();

-- Чтобы включить оповещения, выполните отдельно (подставьте свои значения):
-- UPDATE public.bot_settings SET bot_token = '123456:ABC...', chat_id = '123456789' WHERE id = 1;

-- 9. Заявки на запись с сайта (оставить может любой, читает только мастер)
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  contact text NOT NULL CHECK (length(contact) BETWEEN 3 AND 100),
  service text NOT NULL DEFAULT '' CHECK (length(service) <= 200),
  wish_time text NOT NULL DEFAULT '' CHECK (length(wish_time) <= 200),
  comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 1000),
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.booking_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking insert" ON public.booking_requests;
DROP POLICY IF EXISTS "booking master" ON public.booking_requests;
CREATE POLICY "booking insert" ON public.booking_requests FOR INSERT TO anon, authenticated WITH CHECK (done = false);
CREATE POLICY "booking master" ON public.booking_requests FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master());

CREATE OR REPLACE FUNCTION public.on_new_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_master('📅 Заявка на запись: ' || NEW.name || ' · ' || NEW.contact
    || coalesce(E'\nУслуга: ' || nullif(NEW.service,''), '')
    || coalesce(E'\nКогда удобно: ' || nullif(NEW.wish_time,''), '')
    || coalesce(E'\n' || nullif(NEW.comment,''), ''));
  RETURN NEW;
EXCEPTION WHEN others THEN RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS booking_notify ON public.booking_requests;
CREATE TRIGGER booking_notify AFTER INSERT ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.on_new_booking();

-- 10. Подарки Зимнего сада: открываются по реальным визитам, выдачу отмечает только мастер
CREATE TABLE IF NOT EXISTS public.gift_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift text NOT NULL CHECK (gift IN ('tea', 'oil', 'salt')),
  claimed_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, gift)
);
GRANT SELECT, INSERT, DELETE ON public.gift_claims TO authenticated;
GRANT ALL ON public.gift_claims TO service_role;
ALTER TABLE public.gift_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gifts read" ON public.gift_claims;
DROP POLICY IF EXISTS "gifts master" ON public.gift_claims;
CREATE POLICY "gifts read" ON public.gift_claims FOR SELECT TO authenticated USING (client_id = auth.uid() OR public.is_master());
CREATE POLICY "gifts master" ON public.gift_claims FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master());

-- 11. Клиенты, которых мастер вносит вручную (ещё без регистрации на сайте).
--     Чтобы связать такую карточку с аккаунтом клиента, мастер в картотеке
--     вводит подтверждённую клиентом почту и нажимает «Связать с аккаунтом».
--     Автоматическая привязка по номеру телефона отключена в целях безопасности.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS offline boolean NOT NULL DEFAULT false;

-- связанные таблицы следуют за карточкой при удалении/обновлении
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_client_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_client_id_fkey;
ALTER TABLE public.visits ADD CONSTRAINT visits_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.client_notes DROP CONSTRAINT IF EXISTS client_notes_client_id_fkey;
ALTER TABLE public.client_notes ADD CONSTRAINT client_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.gift_claims DROP CONSTRAINT IF EXISTS gift_claims_client_id_fkey;
ALTER TABLE public.gift_claims ADD CONSTRAINT gift_claims_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

GRANT DELETE ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "profile master insert" ON public.profiles;
DROP POLICY IF EXISTS "profile master delete" ON public.profiles;
CREATE POLICY "profile master insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_master() AND offline);
CREATE POLICY "profile master delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_master() AND offline);

DROP FUNCTION IF EXISTS public.phone_key(text);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    coalesce(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.link_offline_profile(_offline_id uuid, _email text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _target_id uuid;
  _off public.profiles;
BEGIN
  IF NOT public.is_master() THEN RAISE EXCEPTION 'only master'; END IF;

  SELECT * INTO _off FROM public.profiles WHERE id = _offline_id AND offline FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'offline_profile_not_found'; END IF;

  SELECT id INTO _target_id FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _target_id IS NULL THEN RAISE EXCEPTION 'account_not_found'; END IF;
  IF _target_id = _offline_id THEN RAISE EXCEPTION 'same_profile'; END IF;

  INSERT INTO public.profiles (id, full_name, phone, telegram, oil, tea, pressure, silence, wishes)
  VALUES (_target_id, _off.full_name, _off.phone, _off.telegram, _off.oil, _off.tea, _off.pressure, _off.silence, _off.wishes)
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(nullif(public.profiles.full_name, ''), EXCLUDED.full_name),
    phone = coalesce(nullif(public.profiles.phone, ''), EXCLUDED.phone),
    telegram = coalesce(nullif(public.profiles.telegram, ''), EXCLUDED.telegram),
    oil = coalesce(nullif(public.profiles.oil, ''), EXCLUDED.oil),
    tea = coalesce(nullif(public.profiles.tea, ''), EXCLUDED.tea),
    pressure = coalesce(nullif(public.profiles.pressure, ''), EXCLUDED.pressure),
    silence = public.profiles.silence OR EXCLUDED.silence,
    wishes = coalesce(nullif(public.profiles.wishes, ''), EXCLUDED.wishes),
    offline = false;

  UPDATE public.subscriptions SET client_id = _target_id WHERE client_id = _offline_id;
  UPDATE public.visits SET client_id = _target_id WHERE client_id = _offline_id;
  UPDATE public.client_notes SET client_id = _target_id WHERE client_id = _offline_id;

  INSERT INTO public.gift_claims (client_id, gift, claimed_on, created_at)
  SELECT _target_id, gift, claimed_on, created_at
  FROM public.gift_claims WHERE client_id = _offline_id
  ON CONFLICT (client_id, gift) DO NOTHING;
  DELETE FROM public.gift_claims WHERE client_id = _offline_id;

  DELETE FROM public.profiles WHERE id = _offline_id AND offline;

  RETURN _target_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.link_offline_profile(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_offline_profile(uuid, text) TO authenticated;

-- не беспокоить мастера оповещением о клиенте, которого она внесла сама
CREATE OR REPLACE FUNCTION public.on_new_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.offline THEN RETURN NEW; END IF;
  PERFORM public.notify_master('🌿 Новый клиент в кабинете: ' || coalesce(nullif(NEW.full_name,''),'без имени')
    || coalesce(' · ' || nullif(NEW.phone,''), ''));
  RETURN NEW;
EXCEPTION WHEN others THEN RETURN NEW;
END $$;
