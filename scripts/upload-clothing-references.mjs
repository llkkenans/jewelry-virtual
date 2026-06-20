import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, extname } from 'path'

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId:     'b996bcd52bc1a16fe4b602853eebbdf8',
    secretAccessKey: '49ca869915b97aefbb7e7bca442231a603aff420bd056fc0a1ae8bfbe6931be6',
  },
})

const BUCKET   = 'jewelry-virtual'
const SOURCE   = '/Users/kenan/Desktop/jewelry_virtual/clothing-references-source'
const R2_PREFIX = 'clothing-references'

const CONTENT_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
}

function getAllFiles(dir) {
  const results = []
  for (const item of readdirSync(dir)) {
    const full = join(dir, item)
    if (statSync(full).isDirectory()) {
      results.push(...getAllFiles(full))
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(item)) {
      results.push(full)
    }
  }
  return results
}

const files = getAllFiles(SOURCE)
console.log(`${files.length} görsel bulundu, yükleniyor...\n`)

let success = 0
let failed  = 0

for (const filePath of files) {
  const relativePath = relative(SOURCE, filePath).replace(/\\/g, '/')
  const r2Key = `${R2_PREFIX}/${relativePath}`
  const ext = extname(filePath).toLowerCase()
  const contentType = CONTENT_TYPES[ext] ?? 'image/png'

  try {
    const buffer = readFileSync(filePath)
    await r2.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         r2Key,
      Body:        buffer,
      ContentType: contentType,
    }))
    console.log('✓', r2Key)
    success++
  } catch (err) {
    console.error('✗', r2Key, '→', err.message)
    failed++
  }
}

console.log(`\nTamamlandı: ${success} başarılı, ${failed} başarısız`)
