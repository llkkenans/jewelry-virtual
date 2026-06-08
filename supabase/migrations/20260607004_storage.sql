-- Storage bucket'ları oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'jewelry-originals',
    'jewelry-originals',
    false,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'jewelry-outputs',
    'jewelry-outputs',
    true,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- jewelry-originals (PRIVATE) — kullanıcı yüklediği takı fotoğrafları
-- Dosya yolu formatı: {user_id}/{filename}
-- ============================================================

DROP POLICY IF EXISTS "originals: kullanici yukleyebilir" ON storage.objects;
CREATE POLICY "originals: kullanici yukleyebilir"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'jewelry-originals' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "originals: kullanici gorebilir" ON storage.objects;
CREATE POLICY "originals: kullanici gorebilir"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'jewelry-originals' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "originals: kullanici silebilir" ON storage.objects;
CREATE POLICY "originals: kullanici silebilir"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'jewelry-originals' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- jewelry-outputs (PUBLIC) — fal.ai ürettiği görseller
-- Dosya yolu formatı: {user_id}/{generation_id}.jpg
-- ============================================================

DROP POLICY IF EXISTS "outputs: herkes gorebilir" ON storage.objects;
CREATE POLICY "outputs: herkes gorebilir"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'jewelry-outputs');

DROP POLICY IF EXISTS "outputs: sunucu yukleyebilir" ON storage.objects;
CREATE POLICY "outputs: sunucu yukleyebilir"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'jewelry-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "outputs: kullanici silebilir" ON storage.objects;
CREATE POLICY "outputs: kullanici silebilir"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'jewelry-outputs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
