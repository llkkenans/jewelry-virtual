import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId:     'b996bcd52bc1a16fe4b602853eebbdf8',
    secretAccessKey: '49ca869915b97aefbb7e7bca442231a603aff420bd056fc0a1ae8bfbe6931be6',
  },
})

const BUCKET = 'jewelry-virtual'
const BASE   = '/Users/kenan/Desktop/jewelry_virtual/clothing-references-source/woman'

// Kenan onaylı eşleştirme — mtime sırasına göre, 1.png/2.png/3.png hariç
const UPLOADS = [
  // LIGHT
  { src: `${BASE}/light/hf_20260619_224520_761e186d-13df-44ef-a342-8fbd81bbec8c.png`, key: 'clothing-references/woman/light/1.png' },
  { src: `${BASE}/light/hf_20260619_224656_aead864e-7777-427f-ba44-166dc92aaaf4.png`, key: 'clothing-references/woman/light/2.png' },
  { src: `${BASE}/light/hf_20260619_224707_6bf5c9b4-8762-4a71-a5e0-2b41b3b420a6.png`, key: 'clothing-references/woman/light/3.png' },
  { src: `${BASE}/light/hf_20260619_225711_ff1c774c-46a0-406a-a5d6-6846699e8a00.png`, key: 'clothing-references/woman/light/4.png' },
  { src: `${BASE}/light/hf_20260619_225723_8257a53b-db7d-4c7a-9e90-31660a62d254.png`, key: 'clothing-references/woman/light/5.png' },
  { src: `${BASE}/light/hf_20260619_225731_50c20b54-7ede-4141-93dc-adb58bfff60e.png`, key: 'clothing-references/woman/light/6.png' },
  { src: `${BASE}/light/hf_20260619_230901_f9cd4e09-a0ab-4466-80df-0f468f84a312.png`, key: 'clothing-references/woman/light/7.png' },
  { src: `${BASE}/light/hf_20260619_230908_a34740a0-1cb2-48ac-a6bb-1d22094b9458.png`, key: 'clothing-references/woman/light/8.png' },
  { src: `${BASE}/light/hf_20260619_230916_0c3df2c8-9948-4ad3-b349-f265c3f1d3db.png`, key: 'clothing-references/woman/light/9.png' },
  // MEDIUM
  { src: `${BASE}/medium/hf_20260619_231905_7a2d9706-4041-4eb7-a3a3-d4e587789cc2.png`, key: 'clothing-references/woman/medium/1.png' },
  { src: `${BASE}/medium/hf_20260619_231917_468c525f-d737-4129-a5b4-40a057b87d4f.png`, key: 'clothing-references/woman/medium/2.png' },
  { src: `${BASE}/medium/hf_20260619_231925_d7f38bb6-174c-4508-a9d4-f3b04da7f2f8.png`, key: 'clothing-references/woman/medium/3.png' },
  { src: `${BASE}/medium/hf_20260619_231935_df0d64e9-521c-4aac-be19-b2f8395ec617.png`, key: 'clothing-references/woman/medium/4.png' },
  { src: `${BASE}/medium/hf_20260619_231944_ffd8d074-f524-4d43-b9e2-c9af3b4946ad.png`, key: 'clothing-references/woman/medium/5.png' },
  { src: `${BASE}/medium/hf_20260619_231951_72c84fd9-dc7e-4ec2-9f39-ee2e50089538.png`, key: 'clothing-references/woman/medium/6.png' },
  { src: `${BASE}/medium/hf_20260619_232005_311afc3a-e590-4527-8d22-eea279921b67.png`, key: 'clothing-references/woman/medium/7.png' },
  { src: `${BASE}/medium/hf_20260619_232016_7f0059fe-d649-4d6d-b8b5-afb28240ec08.png`, key: 'clothing-references/woman/medium/8.png' },
  { src: `${BASE}/medium/hf_20260619_233152_4ca4b60f-7ae9-46ab-92f9-ddc2fa3cd787.png`, key: 'clothing-references/woman/medium/9.png' },
  // DARK
  { src: `${BASE}/dark/hf_20260619_234223_1259980f-d905-471e-9da1-7a0a720edde4.png`, key: 'clothing-references/woman/dark/1.png' },
  { src: `${BASE}/dark/hf_20260619_234233_234cd9e0-d98a-471c-9e66-7781fc7b8639.png`, key: 'clothing-references/woman/dark/2.png' },
  { src: `${BASE}/dark/hf_20260619_234243_6cefe018-9b13-4a0f-877d-91f6626a463e.png`, key: 'clothing-references/woman/dark/3.png' },
  { src: `${BASE}/dark/hf_20260619_235524_7d3f11f6-e277-4c8c-a461-95c38b7aceae.png`,  key: 'clothing-references/woman/dark/4.png' },
  { src: `${BASE}/dark/hf_20260619_235532_f6c8304b-d544-4504-aecc-55a400e4cad8.png`,  key: 'clothing-references/woman/dark/5.png' },
  { src: `${BASE}/dark/hf_20260619_235538_bcdf5cb3-c5a0-4059-9127-393c00ad5e43.png`,  key: 'clothing-references/woman/dark/6.png' },
  { src: `${BASE}/dark/hf_20260620_000807_bac8e232-9ac4-4e20-8834-77a37466c1d2.png`,  key: 'clothing-references/woman/dark/7.png' },
  { src: `${BASE}/dark/hf_20260620_000813_1769698f-4a10-4da9-ba4b-c4e7057320a8.png`,  key: 'clothing-references/woman/dark/8.png' },
  { src: `${BASE}/dark/hf_20260620_000822_b12a8cb9-bb89-4dec-951f-866d5e722c8c.png`,  key: 'clothing-references/woman/dark/9.png' },
]

let success = 0
let failed  = 0
const results = []

console.log(`27 görsel yükleniyor (v3 woman referansları)...\n`)

for (const { src, key } of UPLOADS) {
  try {
    const buffer = readFileSync(src)
    await r2.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: 'image/png',
    }))
    console.log('✓', key, `(${(buffer.length / 1024).toFixed(0)} KB)`)
    results.push({ key, size: buffer.length, status: 'ok' })
    success++
  } catch (err) {
    console.error('✗', key, '→', err.message)
    results.push({ key, size: 0, status: 'HATA: ' + err.message })
    failed++
  }
}

console.log(`\nYükleme tamamlandı: ${success} başarılı, ${failed} başarısız`)

// Doğrulama: HEAD request ile her dosyayı kontrol et
console.log('\n--- Doğrulama (HEAD) ---')
for (const { key } of UPLOADS) {
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    const kb = ((head.ContentLength ?? 0) / 1024).toFixed(0)
    console.log(`✓ ${key}  ${kb} KB`)
  } catch (err) {
    console.error(`✗ ${key}  → ${err.message}`)
  }
}
