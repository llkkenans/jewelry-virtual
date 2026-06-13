-- Storage bucket for generation outputs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: herkes okuyabilir, sadece service_role yazabilir
CREATE POLICY "Public read generations"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generations');
