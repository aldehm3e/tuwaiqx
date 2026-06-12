-- CreateEnum
CREATE TYPE "LocalModelKind" AS ENUM ('chat', 'embedding');

-- CreateEnum
CREATE TYPE "LocalModelStatus" AS ENUM ('uploaded', 'ready', 'failed');

-- CreateTable
CREATE TABLE "LocalModelFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LocalModelKind" NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "status" "LocalModelStatus" NOT NULL DEFAULT 'ready',
    "runtimeHint" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalModelFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalModelFile_storageKey_key" ON "LocalModelFile"("storageKey");

-- CreateIndex
CREATE INDEX "LocalModelFile_kind_idx" ON "LocalModelFile"("kind");

-- CreateIndex
CREATE INDEX "LocalModelFile_createdAt_idx" ON "LocalModelFile"("createdAt");

-- AddForeignKey
ALTER TABLE "LocalModelFile" ADD CONSTRAINT "LocalModelFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
