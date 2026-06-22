CREATE TABLE IF NOT EXISTS brand_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  reference_image_url text NOT NULL,
  scene_prompt text NOT NULL,
  scene_type text,
  industry text,
  industry_scene text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brand_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_brand_scenes" ON brand_scenes
  FOR ALL USING (auth.uid() = user_id);
