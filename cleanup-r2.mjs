import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'b996bcd52bc1a16fe4b602853eebbdf8',
    secretAccessKey: '49ca869915b97aefbb7e7bca442231a603aff420bd056fc0a1ae8bfbe6931be6',
  }
});

const oldFolders = ['afro', 'asian', 'european', 'middleeastern'];

const res = await client.send(new ListObjectsV2Command({ Bucket: 'jewelry-virtual', Prefix: 'references/', MaxKeys: 1000 }));
const toDelete = res.Contents?.filter(obj => oldFolders.some(f => obj.Key.includes(`/${f}/`))) ?? [];

console.log(`Found ${toDelete.length} old files to delete`);

if (toDelete.length > 0) {
  const batches = [];
  for (let i = 0; i < toDelete.length; i += 1000) {
    batches.push(toDelete.slice(i, i + 1000));
  }
  for (const batch of batches) {
    await client.send(new DeleteObjectsCommand({
      Bucket: 'jewelry-virtual',
      Delete: { Objects: batch.map(o => ({ Key: o.Key })) }
    }));
    console.log(`Deleted ${batch.length} files`);
  }
}
console.log('DONE!');
