import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { getEnv } from "@/src/lib/config/env";

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

export async function storeUpload(input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const env = getEnv();
  const key = `${new Date().toISOString().slice(0, 10)}/${nanoid()}-${safeFilename(input.filename)}`;

  if (env.STORAGE_DRIVER === "s3") {
    if (!env.S3_ENDPOINT || !env.S3_BUCKET) {
      throw new Error("S3 storage is selected but S3_ENDPOINT or S3_BUCKET is missing.");
    }

    const client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: env.S3_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY
          }
        : undefined
    });

    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType
      })
    );
    return key;
  }

  const destination = path.join(env.STORAGE_PATH, key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, input.buffer);
  return key;
}

export async function removeStoredObject(key?: string | null) {
  if (!key) {
    return;
  }

  const env = getEnv();
  if (env.STORAGE_DRIVER === "s3") {
    if (!env.S3_ENDPOINT || !env.S3_BUCKET) {
      return;
    }

    const client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: env.S3_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY
          }
        : undefined
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key
      })
    );
    return;
  }

  const root = path.resolve(env.STORAGE_PATH);
  const target = path.resolve(root, key);
  if (target === root || !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Refusing to delete a file outside the configured storage path.");
  }

  await fs.rm(target, { force: true });
}
