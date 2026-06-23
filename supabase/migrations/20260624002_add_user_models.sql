CREATE TABLE IF NOT EXISTS user_models (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name        text,
  image_key   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi modelleri" ON user_models
  FOR ALL USING (auth.uid() = user_id);
