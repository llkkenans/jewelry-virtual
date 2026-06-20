import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId:     'b996bcd52bc1a16fe4b602853eebbdf8',
    secretAccessKey: '49ca869915b97aefbb7e7bca442231a603aff420bd056fc0a1ae8bfbe6931be6',
  },
})

const BUCKET = 'jewelry-virtual'
const jewelryTypes = ['ring', 'necklace', 'earring', 'watch']
const genders      = ['woman', 'man']
const ethnicities  = ['european', 'asian', 'afro', 'middleeastern']
const skinTones    = ['ivory', 'sand', 'honey', 'caramel', 'espresso']
const nailStyles   = ['natural', 'french', 'red', 'dark']

const keys = []

for (const jewelry of jewelryTypes) {
  for (const gender of genders) {
    for (const ethnicity of ethnicities) {
      if (jewelry === 'ring' && gender === 'woman') {
        // Tırnak tarzı alt klasörü
        for (const skin of skinTones) {
          for (const nail of nailStyles) {
            keys.push(`references/${jewelry}/${gender}/${ethnicity}/${skin}/${nail}.jpg`)
          }
        }
      } else {
        // Direkt cilt tonu
        for (const skin of skinTones) {
          keys.push(`references/${jewelry}/${gender}/${ethnicity}/${skin}.jpg`)
        }
      }
    }
  }
}

console.log(`Toplam ${keys.length} placeholder oluşturulacak...`)

for (const key of keys) {
  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        Buffer.from('placeholder'),
    ContentType: 'image/jpeg',
  }))
  console.log('✓', key)
}

console.log('Tamamlandı!')
