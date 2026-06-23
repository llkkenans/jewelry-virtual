CREATE TABLE IF NOT EXISTS video_generations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_image_url    text NOT NULL,
  source_studio       text NOT NULL DEFAULT 'fashion',
  video_url           text,
  status              text NOT NULL DEFAULT 'pending',
  credits_used        integer NOT NULL DEFAULT 6,
  fashn_id            text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi videolari" ON video_generations
  FOR ALL USING (auth.uid() = user_id);
