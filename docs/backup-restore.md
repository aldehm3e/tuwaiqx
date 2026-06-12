# Backup and Restore

Run:

```bash
./scripts/backup.sh ./backups/tuwaiqx-$(date +%F)
```

Restore:

```bash
./scripts/restore.sh ./backups/tuwaiqx-2026-06-12
```

Backups should be encrypted and stored away from the application server. Treat backups as sensitive because they contain conversations, documents, tickets, form submissions, and provider configuration.

Test restores regularly on a separate server.

