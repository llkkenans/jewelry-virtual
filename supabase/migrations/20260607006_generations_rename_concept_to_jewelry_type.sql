-- concept → jewelry_type: CHECK constraint kaldır, kolon yeniden adlandır, nullable yap
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_concept_check;
ALTER TABLE public.generations RENAME COLUMN concept TO jewelry_type;
ALTER TABLE public.generations ALTER COLUMN jewelry_type DROP NOT NULL;
