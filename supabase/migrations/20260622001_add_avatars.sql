-- Avatars table: pre-defined model characters for clothing try-on
CREATE TABLE IF NOT EXISTS avatars (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  gender      text NOT NULL CHECK (gender IN ('woman', 'man')),
  skin_tone   text NOT NULL CHECK (skin_tone IN ('light', 'medium', 'dark')),
  description text,
  pose_count  integer NOT NULL DEFAULT 3,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: avatars are public read, only service role can write
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatars_public_read" ON avatars
  FOR SELECT USING (true);

-- Add avatar reference to clothing_generations
ALTER TABLE clothing_generations
  ADD COLUMN IF NOT EXISTS avatar_id text REFERENCES avatars(id);

-- Seed first test avatar
INSERT INTO avatars (id, name, gender, skin_tone, description, pose_count)
VALUES (
  'elif',
  'Elif',
  'woman',
  'light',
  'Açık tenli, uzun koyu saçlı, fashion model',
  3
) ON CONFLICT (id) DO NOTHING;
