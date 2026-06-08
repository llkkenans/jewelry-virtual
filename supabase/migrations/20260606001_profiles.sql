-- profiles tablosu: Supabase auth.users'a bağlı kullanıcı profilleri
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  credits             integer DEFAULT 10,
  plan                text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  stripe_customer_id  text,
  created_at          timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kendi profili" ON public.profiles;
CREATE POLICY "kendi profili"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id);

-- Yeni auth kullanıcısı kayıt olunca profiles'a otomatik satır ekle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
