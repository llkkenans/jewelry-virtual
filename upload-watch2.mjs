import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'b996bcd52bc1a16fe4b602853eebbdf8',
    secretAccessKey: '49ca869915b97aefbb7e7bca442231a603aff420bd056fc0a1ae8bfbe6931be6',
  }
});

const baseDir = '/Users/kenan/Desktop/jewelry_virtual/reference/watch';

const remaining = [
  ['man', 'honey', 3],
  ['man', 'honey', 4],
  ['man', 'honey', 5],
  ['man', 'caramel', 1],
  ['man', 'caramel', 2],
  ['man', 'caramel', 3],
  ['man', 'caramel', 4],
  ['man', 'caramel', 5],
  ['man', 'espresso', 1],
  ['man', 'espresso', 2],
  ['man', 'espresso', 3],
  ['man', 'espresso', 4],
  ['man', 'espresso', 5],
  ['woman', 'ivory', 1],
  ['woman', 'ivory', 2],
  ['woman', 'ivory', 3],
  ['woman', 'sand', 1],
  ['woman', 'sand', 2],
  ['woman', 'sand', 3],
  ['woman', 'honey', 1],
  ['woman', 'honey', 2],
  ['woman', 'honey', 3],
  ['woman', 'caramel', 1],
  ['woman', 'caramel', 2],
  ['woman', 'caramel', 3],
  ['woman', 'espresso', 1],
  ['woman', 'espresso', 2],
  ['woman', 'espresso', 3],
];

for (const [gender, tone, idx] of remaining) {
  const toneDir = path.join(baseDir, gender, tone);
  const files = fs.readdirSync(toneDir)
    .filter(f => f.endsWith('.png') && !f.startsWith('.') && f !== '.gitkeep')
    .sort();
  
  const file = files[idx - 1];
  if (!file) { console.log('SKIP (no file):', gender, tone, idx); continue; }
  
  const filePath = path.join(toneDir, file);
  const key = `references/watch/${gender}/${tone}/${idx}.png`;
  const body = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({ Bucket: 'jewelry-virtual', Key: key, Body: body, ContentType: 'image/png' }));
  console.log('UPLOADED:', key);
}
console.log('DONE!');
