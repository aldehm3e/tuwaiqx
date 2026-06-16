# Backup and Restore

Backups are required for production. A usable backup needs:

- PostgreSQL database data.
- Uploaded knowledge files.
- The production `.env` file, especially `AUTH_SECRET`.
- Uploaded local model files under `MODEL_STORAGE_PATH`, if used.
- External runtime configuration, if Ollama, LocalAI, llama.cpp, vLLM, SGLang, or another runtime is managed outside this repository.

`AUTH_SECRET` is critical because provider API keys are encrypted with it. If the database is restored with a different `AUTH_SECRET`, existing encrypted provider keys may need to be re-entered in `/admin/models`.

## Docker Compose Backup

From the TuwaiqX repository directory, run:

```bash
BACKUP_DIR="./backups/tuwaiqx-$(date +%F)"
./scripts/backup.sh "$BACKUP_DIR"
```

The script creates:

- `database.sql`
- `uploads.tar.gz`
- `env.example.snapshot`

The script does not copy the real `.env` file and does not archive uploaded model files. Copy those separately:

```bash
cp .env "$BACKUP_DIR/env.production"
docker run --rm -v tuwaiqx_models:/models -v "$(pwd)/$BACKUP_DIR:/backup" alpine:3.20 tar -czf /backup/models.tar.gz -C /models .
```

If you use a bind mount for `MODEL_STORAGE_PATH`, archive that directory instead of the `tuwaiqx_models` Docker volume.

## Restore

Restore on a separate server first whenever possible:

```bash
BACKUP_DIR="./backups/tuwaiqx-2026-06-12"
./scripts/restore.sh "$BACKUP_DIR"
```

Then restore the production `.env` file and model files if they were backed up separately. For a Docker named volume:

```bash
cp "$BACKUP_DIR/env.production" .env
docker run --rm -v tuwaiqx_models:/models -v "$(pwd)/$BACKUP_DIR:/backup" alpine:3.20 sh -c "rm -rf /models/* && tar -xzf /backup/models.tar.gz -C /models"
```

After restore:

1. Start the stack.
2. Open `/admin/system`.
3. Retest model providers in `/admin/models`.
4. Re-enter provider API keys if `AUTH_SECRET` changed.
5. Test one bot answer and one uploaded document.

Backups should be encrypted and stored away from the application server. Treat backups as sensitive because they contain conversations, documents, tickets, uploaded knowledge, and provider configuration.
