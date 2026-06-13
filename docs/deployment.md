# Deployment

TuwaiqX is a standalone self-hosted package designed for a single organization per installation. It is not a hosted subscription platform.

Recommended production layout:

- Reverse proxy with HTTPS.
- Docker Compose services on a private network.
- PostgreSQL volume on persistent storage.
- Redis volume for queues.
- Local upload volume or S3-compatible storage.
- Optional Ollama service on GPU/CPU hardware sized for the selected model.

Example reverse proxy targets:

- Public app and widget: `https://bot.organization.org`
- Admin: `https://bot.organization.org/admin`

Set `APP_URL` to the public HTTPS URL and keep `/admin` restricted to trusted staff.

The default Docker Compose file publishes only the TuwaiqX web service. PostgreSQL, Redis, MinIO, Ollama, and LocalAI stay on the Docker network and should not be exposed publicly. If an operator needs temporary host access for maintenance, use a local-only override or SSH tunnel rather than opening those ports to the internet.
