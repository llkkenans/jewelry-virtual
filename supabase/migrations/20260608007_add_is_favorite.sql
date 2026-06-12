ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_generations_user_favorite
  ON public.generations (user_id, is_favorite)
  WHERE is_favorite = true;
