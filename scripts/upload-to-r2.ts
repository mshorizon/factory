import { readFileSync } from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  const [, , localPath, key, contentType = "image/png"] = process.argv;
  if (!localPath || !key) {
    console.error("Usage: tsx scripts/upload-to-r2.ts <localPath> <r2Key> [contentType]");
    process.exit(1);
  }

  const endpoint = process.env.R2_ENDPOINT!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_DOMAIN!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: readFileSync(localPath),
      ContentType: contentType,
    })
  );

  console.log(`${publicUrl.replace(/\/+$/, "")}/${key}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
