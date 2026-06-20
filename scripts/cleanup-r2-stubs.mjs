import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: "https://2acaa69f1becee829ce9b2ca23fc0344.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "b996bcd52bc1a16fe4b602853eebbdf8",
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const BUCKET = "jewelry-virtual";

// Geçerli path pattern: references/{type}/{gender}/{skinTone}/{index}.png
// Silmek istediğimiz: bu pattern'a UYMAYAN her şey references/ altında

const VALID_TYPES = ["ring", "necklace", "earring", "watch"];
const VALID_GENDERS = ["man", "woman"];
const VALID_SKIN_TONES = ["ivory", "sand", "honey", "caramel", "espresso"];

function isValidPath(key) {
  // references/ring/woman/ivory/1.png → geçerli
  const parts = key.replace("references/", "").split("/");
  if (parts.length !== 4) return false;
  const [type, gender, skinTone, file] = parts;
  return (
    VALID_TYPES.includes(type) &&
    VALID_GENDERS.includes(gender) &&
    VALID_SKIN_TONES.includes(skinTone) &&
    file.endsWith(".png")
  );
}

async function listAll() {
  const keys = [];
  let continuationToken;
  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "references/",
      ContinuationToken: continuationToken,
    }));
    for (const obj of res.Contents ?? []) {
      keys.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

async function main() {
  console.log("R2 dosyaları listeleniyor...");
  const allKeys = await listAll();
  console.log(`Toplam: ${allKeys.length} dosya`);

  const toDelete = allKeys.filter(k => !isValidPath(k));
  console.log(`Silinecek: ${toDelete.length} stub dosya`);

  if (toDelete.length === 0) {
    console.log("Silinecek dosya yok, çıkılıyor.");
    return;
  }

  // Preview — ilk 20'yi göster
  console.log("Örnek silinecekler:", toDelete.slice(0, 20));

  // 1000'er chunk'larla sil
  const chunks = [];
  for (let i = 0; i < toDelete.length; i += 1000) {
    chunks.push(toDelete.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    await client.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: chunk.map(k => ({ Key: k })) },
    }));
    console.log(`${chunk.length} dosya silindi.`);
  }

  console.log("Temizlik tamamlandı.");
}

main().catch(console.error);
