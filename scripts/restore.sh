#!/usr/bin/env bash
set -euo pipefail

IN_DIR="${1:?Usage: ./scripts/restore.sh ./backups/tuwaiqx-YYYY-MM-DD}"

if [ ! -f "$IN_DIR/database.sql" ]; then
  echo "Missing $IN_DIR/database.sql"
  exit 1
fi

echo "Restoring PostgreSQL..."
if command -v docker >/dev/null 2>&1 && docker compose ps tuwaiqx-postgres >/dev/null 2>&1; then
  docker compose exec -T tuwaiqx-postgres psql -U tuwaiqx -d tuwaiqx < "$IN_DIR/database.sql"
else
  psql "${DATABASE_URL:?DATABASE_URL is required}" < "$IN_DIR/database.sql"
fi

if [ -f "$IN_DIR/uploads.tar.gz" ]; then
  echo "Restoring uploads..."
  if [ -n "${STORAGE_PATH:-}" ]; then
    mkdir -p "$STORAGE_PATH"
    tar -xzf "$IN_DIR/uploads.tar.gz" -C "$STORAGE_PATH"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm -v tuwaiqx_uploads:/data -v "$(pwd)/$IN_DIR:/backup" alpine:3.20 sh -c "rm -rf /data/* && tar -xzf /backup/uploads.tar.gz -C /data"
  fi
fi

echo "Restore complete."
