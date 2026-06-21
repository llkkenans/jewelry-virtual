ALTER TABLE product_generations
ADD COLUMN IF NOT EXISTS batch_id uuid,
ADD COLUMN IF NOT EXISTS shadow_intensity text DEFAULT 'medium';

-- batch_id: "Tüm Sahneleri Üret" ile oluşturulan 6 görseli gruplar
-- shadow_intensity: 'soft' | 'medium' | 'dramatic'
