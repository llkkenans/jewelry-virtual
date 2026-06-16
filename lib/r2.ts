import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET  = process.env.CLOUDFLARE_R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

export async function getFromR2(key: string): Promise<Buffer> {
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
  const { Readable } = await import('stream')

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  })

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'jewelry-virtual',
    Key: key,
  })

  const response = await client.send(command)
  const stream = response.Body as import('stream').Readable
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
