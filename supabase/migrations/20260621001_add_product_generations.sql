-- Product Photography Studio generations
CREATE TABLE IF NOT EXISTS product_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_image_url text NOT NULL,
  output_image_url text,
  scene_type text NOT NULL, -- 'ecommerce' | 'marble' | 'lifestyle' | 'nature' | 'minimal' | 'dark_luxury'
  status text DEFAULT 'pending', -- 'pending' | 'processing' | 'done' | 'failed'
  credits_used integer DEFAULT 2,
  is_saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi_urunleri" ON product_generations
  FOR ALL USING (auth.uid() = user_id);
