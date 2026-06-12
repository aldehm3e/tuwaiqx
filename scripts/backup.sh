#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-./backups/tuwaiqx-$(date +%F-%H%M%S)}"
mkdir -p "$OUT_DIR"

echo "Backing up PostgreSQL..."
if command -v docker >/dev/null 2>&1 && docker compose ps tuwaiqx-postgres >/dev/null 2>&1; then
  docker compose exec -T tuwaiqx-postgres pg_dump -U tuwaiqx tuwaiqx > "$OUT_DIR/database.sql"
else
  pg_dump "${DATABASE_URL:?DATABASE_URL is required}" > "$OUT_DIR/database.sql"
fi

echo "Backing up uploads..."
if [ -n "${STORAGE_PATH:-}" ] && [ -d "$STORAGE_PATH" ]; then
  tar -czf "$OUT_DIR/uploads.tar.gz" -C "$STORAGE_PATH" .
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v tuwaiqx_uploads:/data -v "$(pwd)/$OUT_DIR:/backup" alpine:3.20 tar -czf /backup/uploads.tar.gz -C /data .
else
  echo "No local upload path found; skipping upload archive."
fi

cp .env.example "$OUT_DIR/env.example.snapshot"
echo "Backup written to $OUT_DIR"
