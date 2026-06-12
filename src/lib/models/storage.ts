import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";
import type { LocalModelKind } from "@prisma/client";
import { nanoid } from "nanoid";
import { getEnv } from "@/src/lib/config/env";

const allowedModelExtensions = new Set(["gguf", "ggml", "bin", "safetensors", "onnx", "model"]);

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

export function modelFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isAllowedModelFile(filename: string) {
  return allowedModelExtensions.has(modelFileExtension(filename));
}

export function modelStorageRoot() {
  return path.resolve(getEnv().MODEL_STORAGE_PATH);
}

export function localModelPath(storageKey: string) {
  const root = modelStorageRoot();
  const target = path.resolve(root, storageKey);
  if (target === root || !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Refusing to access a file outside the configured model storage path.");
  }
  return target;
}

function yamlString(value: string) {
  return JSON.stringify(value);
}

export function supportsLocalAiConfig(format: string) {
  return format.toLowerCase() === "gguf";
}

export function localAiRuntimeModelName(input: { id: string; kind: LocalModelKind }) {
  return `tuwaiqx-${input.kind}-${input.id}`;
}

export function localAiConfigKey(id: string) {
  return `localai-${id}.yaml`;
}

export async function writeLocalAiConfig(input: {
  id: string;
  kind: LocalModelKind;
  format: string;
  storageKey: string;
}) {
  if (!supportsLocalAiConfig(input.format)) {
    return null;
  }

  const modelName = localAiRuntimeModelName({ id: input.id, kind: input.kind });
  const knownUsecases = input.kind === "embedding" ? ["embeddings"] : ["chat", "completion"];
  const lines = [
    `name: ${yamlString(modelName)}`,
    "backend: llama-cpp",
    input.kind === "embedding" ? "embeddings: true" : "",
    "parameters:",
    `  model: ${yamlString(input.storageKey.replace(/\\/g, "/"))}`,
    "context_size: 2048",
    "threads: 4",
    "known_usecases:",
    ...knownUsecases.map((usecase) => `  - ${usecase}`),
    ""
  ].filter(Boolean);
  const storageKey = localAiConfigKey(input.id);
  const destination = localModelPath(storageKey);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, lines.join("\n"), "utf8");

  return { modelName, storageKey };
}

export async function storeLocalModelFile(input: {
  file: File;
  kind: LocalModelKind;
  maxBytes: number;
}) {
  const format = modelFileExtension(input.file.name);
  if (!isAllowedModelFile(input.file.name)) {
    throw new Error(`${input.file.name} is not a supported model file type.`);
  }
  if (input.file.size > input.maxBytes) {
    throw new Error(`${input.file.name} exceeds the configured model upload limit.`);
  }

  const key = `${input.kind}/${new Date().toISOString().slice(0, 10)}/${nanoid()}-${safeFilename(input.file.name)}`;
  const destination = localModelPath(key);
  const temporaryDestination = `${destination}.uploading`;
  await fs.mkdir(path.dirname(destination), { recursive: true });

  const hash = createHash("sha256");
  const writer = createWriteStream(temporaryDestination, { flags: "wx" });
  const reader = input.file.stream().getReader();
  let written = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = Buffer.from(value);
      written += chunk.length;
      if (written > input.maxBytes) {
        throw new Error(`${input.file.name} exceeds the configured model upload limit.`);
      }

      hash.update(chunk);
      if (!writer.write(chunk)) {
        await once(writer, "drain");
      }
    }

    writer.end();
    await once(writer, "finish");
    await fs.rename(temporaryDestination, destination);
  } catch (error) {
    writer.destroy();
    await fs.rm(temporaryDestination, { force: true }).catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }

  return {
    storageKey: key,
    format,
    sha256: hash.digest("hex"),
    sizeBytes: BigInt(written)
  };
}

export async function removeLocalModelFile(storageKey?: string | null) {
  if (!storageKey) {
    return;
  }

  await fs.rm(localModelPath(storageKey), { force: true });
}

export async function removeLocalAiConfig(id: string) {
  await fs.rm(localModelPath(localAiConfigKey(id)), { force: true });
}
