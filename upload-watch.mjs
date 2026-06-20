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

const genders = ['man', 'woman'];
const skinTones = ['ivory', 'sand', 'honey', 'caramel', 'espresso'];
const baseDir = '/Users/kenan/Desktop/jewelry_virtual/reference/watch';

for (const gender of genders) {
  for (const tone of skinTones) {
    const toneDir = path.join(baseDir, gender, tone);
    if (!fs.existsSync(toneDir)) { console.log('MISSING DIR:', gender, tone); continue; }
    
    const files = fs.readdirSync(toneDir)
      .filter(f => f.endsWith('.png') && !f.startsWith('.') && f !== '.gitkeep')
      .sort();
    
    if (files.length === 0) { console.log('EMPTY:', gender, tone); continue; }
    
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(toneDir, files[i]);
      const key = `references/watch/${gender}/${tone}/${i + 1}.png`;
      const body = fs.readFileSync(filePath);
      await client.send(new PutObjectCommand({ Bucket: 'jewelry-virtual', Key: key, Body: body, ContentType: 'image/png' }));
      console.log('UPLOADED:', key);
    }
  }
}
console.log('DONE!');
