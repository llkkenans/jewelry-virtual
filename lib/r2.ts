import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'

const getR2Client = () => new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'jewelry-virtual'

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const client = getR2Client()
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return key
}

export async function getFromR2(key: string): Promise<Buffer> {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })
  const response = await client.send(command)
  const stream = response.Body as Readable
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}
