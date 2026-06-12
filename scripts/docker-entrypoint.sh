#!/usr/bin/env sh
set -eu

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "WARNING: AUTH_SECRET is not set. Generating an ephemeral startup secret."
  echo "Set AUTH_SECRET in .env before production use so sessions and encrypted provider keys survive restarts."
  export AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting TuwaiqX..."
exec npm run start
