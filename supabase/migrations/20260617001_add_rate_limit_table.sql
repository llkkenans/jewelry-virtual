CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Eski kayıtları temizlemek için: 1 saatten eski satırları sil
-- Bu trigger değil, API tarafında çağrılacak

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- Rate limit tablosuna sadece service role erişebilir (API route'lardan)
-- Kullanıcılar kendi rate limit kayıtlarını göremez
CREATE POLICY "service role only" ON rate_limits
  FOR ALL
  USING (false);
