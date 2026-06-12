#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit AUTH_SECRET before production use."
fi

npm install
npx prisma generate

echo "TuwaiqX dependencies are installed."
echo "Run: docker compose up -d"
echo "Optional local models: docker compose --profile ollama up -d"

