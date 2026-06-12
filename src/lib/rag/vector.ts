import { prisma } from "@/src/lib/db/prisma";

let pgVectorAvailable: Promise<boolean> | undefined;

export function vectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

export function isPgVectorAvailable() {
  pgVectorAvailable ??= prisma
    .$queryRaw<Array<{ available: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) AS available
    `
    .then((rows) => Boolean(rows[0]?.available))
    .catch(() => false);

  return pgVectorAvailable;
}
