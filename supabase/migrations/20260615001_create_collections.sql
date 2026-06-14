-- Koleksiyonlar tablosu
CREATE TABLE collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  cover_image_url text,
  created_at  timestamptz DEFAULT now()
);

-- Koleksiyon ↔ Görsel ilişkisi
CREATE TABLE collection_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   uuid REFERENCES collections(id) ON DELETE CASCADE,
  generation_id   uuid REFERENCES generations(id) ON DELETE CASCADE,
  added_at        timestamptz DEFAULT now(),
  UNIQUE(collection_id, generation_id)
);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi koleksiyonları" ON collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "kendi koleksiyon öğeleri" ON collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_generation_id ON collection_items(generation_id);
