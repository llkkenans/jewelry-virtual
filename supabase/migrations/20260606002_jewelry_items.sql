-- jewelry_items tablosu: Kullanıcıların yüklediği takı görselleri
CREATE TABLE IF NOT EXISTS public.jewelry_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                text,
  original_image_url  text NOT NULL,
  created_at          timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.jewelry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kendi takıları" ON public.jewelry_items;
CREATE POLICY "kendi takıları"
  ON public.jewelry_items
  FOR ALL
  USING (auth.uid() = user_id);
