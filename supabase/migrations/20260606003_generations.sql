-- generations tablosu: fal.ai üretim kayıtları
CREATE TABLE IF NOT EXISTS public.generations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jewelry_item_id  uuid NOT NULL REFERENCES public.jewelry_items(id) ON DELETE CASCADE,
  concept          text NOT NULL CHECK (concept IN ('ecommerce', 'studio', 'engagement', 'lifestyle')),
  output_image_url text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  credits_used     integer NOT NULL DEFAULT 1,
  created_at       timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kendi üretimleri" ON public.generations;
CREATE POLICY "kendi üretimleri"
  ON public.generations
  FOR ALL
  USING (auth.uid() = user_id);

-- Kredi düşüş trigger'ı: her generation INSERT'te profiles.credits'i azalt
CREATE OR REPLACE FUNCTION public.deduct_credit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - NEW.credits_used
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_generation_insert
  AFTER INSERT ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.deduct_credit();
