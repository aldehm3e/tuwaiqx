import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { getEnv } from "@/src/lib/config/env";

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

function localStoredPath(root: string, key: string) {
  const target = path.resolve(root, key);
  if (target === root || !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Refusing to access a file outside the configured storage path.");
  }

  return target;
}

function s3Client() {
  const env = getEnv();
  if (!env.S3_ENDPOINT || !env.S3_BUCKET) {
    throw new Error("S3 storage is selected but S3_ENDPOINT or S3_BUCKET is missing.");
  }

  return {
    bucket: env.S3_BUCKET,
    client: new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: env.S3_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY
          }
        : undefined
    })
  };
}

async function bodyToBuffer(body: unknown) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body === "object" && "transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  if (typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error("Stored object body could not be read.");
}

export async function storeUpload(input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const env = getEnv();
  const key = `${new Date().toISOString().slice(0, 10)}/${nanoid()}-${safeFilename(input.filename)}`;

  if (env.STORAGE_DRIVER === "s3") {
    const { bucket, client } = s3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
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

export async function readStoredObject(key: string) {
  const env = getEnv();
  if (env.STORAGE_DRIVER === "s3") {
    const { bucket, client } = s3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    return bodyToBuffer(response.Body);
  }

  return fs.readFile(localStoredPath(path.resolve(env.STORAGE_PATH), key));
}

export async function removeStoredObject(key?: string | null) {
  if (!key) {
    return;
  }

  const env = getEnv();
  if (env.STORAGE_DRIVER === "s3") {
    const { bucket, client } = s3Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );
    return;
  }

  const root = path.resolve(env.STORAGE_PATH);
  await fs.rm(localStoredPath(root, key), { force: true });
}
