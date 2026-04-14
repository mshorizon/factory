import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let r2Config: {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
} | null = null;

let s3Client: S3Client | null = null;

/**
 * Initialize R2 configuration. Call once from middleware with env vars.
 */
export function initR2(config: {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}) {
  r2Config = config;
}

/**
 * Get or create the S3-compatible client for Cloudflare R2.
 */
function getR2Client(): S3Client {
  if (!r2Config) {
    throw new Error("R2 not initialized. Call initR2() first.");
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

/**
 * Upload a file to R2 and return its public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  if (!r2Config) {
    throw new Error("R2 not initialized. Call initR2() first.");
  }

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const baseUrl = r2Config.publicUrl.replace(/\/+$/, "");
  return `${baseUrl}/${key}`;
}

/**
 * Delete a file from R2 by its object key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2Config) {
    throw new Error("R2 not initialized. Call initR2() first.");
  }

  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    })
  );
}

/**
 * Get the configured public base URL for R2.
 */
export function getR2PublicUrl(): string {
  if (!r2Config || !r2Config.publicUrl) {
    throw new Error(
      "R2 public URL not configured. Set the R2_PUBLIC_DOMAIN environment variable."
    );
  }
  return r2Config.publicUrl.replace(/\/+$/, "");
}
