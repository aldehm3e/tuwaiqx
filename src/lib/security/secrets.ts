import crypto from "node:crypto";
import { getAuthSecret } from "@/src/lib/config/env";

function key() {
  return crypto.createHash("sha256").update(getAuthSecret()).digest();
}

export function encryptSecret(value: string) {
  if (!value) {
    return "";
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value?: string | null) {
  if (!value) {
    return "";
  }

  const parts = value.split(".");
  if (parts.length !== 3) {
    return value;
  }

  const [ivValue, tagValue, encryptedValue] = parts;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

