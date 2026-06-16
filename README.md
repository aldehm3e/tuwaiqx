# TuwaiqX

TuwaiqX is a GNU AGPL self-hosted AI chatbot system for organizations. It lets NGOs, universities, charities, schools, and nonprofits run their own website assistant using their own server, documents, and model provider.

TuwaiqX is not a SaaS product, not a hosted subscription platform, and not a small MVP demo. It is a complete open-source package that an organization can clone from GitHub, install on its own server, connect to a local model such as Ollama or to an optional API-key model provider, upload its documents, configure its bot, and embed the bot into its own website.

Author: Eng. Abdulrahman Alsaedi

## Features

- Next.js admin dashboard with first-run setup, local admin auth, RBAC, audit log, and system health.
- Ollama/local model support by default, plus optional OpenAI-compatible model providers.
- Local model file upload and deletion for self-hosted runtimes that load downloaded model files from disk.
- Clean provider interface for adding more model adapters.
- Document upload and indexing for PDF, DOCX, TXT, Markdown, HTML, CSV, XLSX, JSON, manual text, FAQ, and website crawling.
- Retrieval-augmented chat with pgvector search, full-text fallback, strict mode, citations, conversation logs, feedback, and knowledge gap tracking.
- Standalone embeddable `widget.js` with Shadow DOM, localStorage conversation continuity, RTL/LTR support, quick actions, sources, and feedback.
- Built-in tickets/handoff, local analytics, CSV/JSON-oriented APIs, backup/restore scripts, and documentation for self-hosting.

## License

TuwaiqX is licensed under GNU AGPL-3.0-or-later for the main application.

## Requirements

- Docker and Docker Compose
- Node.js 20 for local development
- PostgreSQL with pgvector, Redis, and local or S3-compatible storage
- Optional: Ollama, LocalAI, llama.cpp server, vLLM, or another local runtime for fully local model execution

## Quick Start

```bash
git clone https://github.com/aldehm3e/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
docker compose up -d
```

Docker Compose starts the web app and the BullMQ indexing worker. Redis is used for indexing jobs and distributed rate limiting.

Open the admin dashboard on your server:

```text
https://their-server.org/admin
```

Then:

1. Complete the first-run setup.
2. Configure organization name, logo, colors, language, and website domain.
3. Connect a model provider:
   - Ollama/local model by default
   - OpenAI-compatible API endpoint optionally
   - Uploaded local model files loaded by a local runtime
   - Other provider adapters through a clean interface
4. Upload documents.
5. Wait for indexing.
6. Test the bot.
7. Copy the widget embed code.
8. Paste the widget code into the organization website.
9. Use the bot without relying on paid SaaS chatbot services.

To start Ollama with the stack:

```bash
docker compose --profile ollama up -d
docker compose exec tuwaiqx-ollama ollama pull <chat-model>
docker compose exec tuwaiqx-ollama ollama pull <embedding-model>
```

To start the optional LocalAI runtime for uploaded `.gguf` files:

```bash
docker compose --profile local-models up -d
```

## Configuration

Use `.env.example` as the baseline. The default database settings are:

```env
APP_NAME=TuwaiqX
DATABASE_URL=postgresql://tuwaiqx:tuwaiqx@postgres:5432/tuwaiqx
SOURCE_CODE_URL=https://github.com/aldehm3e/tuwaiqx
```

## Database

Migrations run in the Docker entrypoint with:

```bash
npm run migrate:deploy
```

For local development:

```bash
npm install
npm run prisma:generate
npm run migrate:dev
npm run seed
npm run dev
```

For non-Docker development or manual installs, run the indexing worker in a second terminal:

```bash
npm run worker
```

Seed data creates the demo organization `Peaceful Aid NGO`, the Main Website Assistant, Volunteer Assistant, Donation Assistant, Support Assistant, English and Arabic knowledge samples, and a volunteer form. It is optional and not required for production. Production customers should complete `/admin/setup` on a fresh database instead of running `npm run seed`.

## Model Providers

The default path is Ollama:

```env
DEFAULT_MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=<chat-model>
OLLAMA_EMBEDDING_MODEL=<embedding-model>
```

Use any compatible chat and embedding models supported by your runtime. Embedding dimensions can differ between models; TuwaiqX only compares vectors with the same dimension, but you should re-index knowledge after changing embedding models so semantic retrieval uses the new model. Large local chat models may require more Docker/Ollama memory, GPU support, longer timeouts, or a smaller model. If a thinking model returns no final answer, increase `OLLAMA_CHAT_MIN_PREDICT`.

`EMBEDDING_CONCURRENCY` defaults to `1`, which is safest for local Ollama and LocalAI. Increase it carefully, for example to `2` or `4`, only when your embedding provider can handle parallel requests.

Optional OpenAI-compatible endpoints are configured in the admin dashboard or `.env`. TuwaiqX does not hardcode one paid vendor.

Downloaded model files can be uploaded in `/admin/models`. TuwaiqX stores them under `MODEL_STORAGE_PATH` so a local runtime can load them from disk. For `.gguf` uploads, TuwaiqX also generates LocalAI config files and shows the runtime model names in the admin UI. Start the optional LocalAI profile or use another runtime, then add its OpenAI-compatible URL as a provider in `/admin/models`.

## Uploading Documents

Go to `/admin/knowledge/upload` and upload supported files. TuwaiqX stores the original file, parses text, chunks content, generates embeddings when a provider is available, stores chunks in pgvector, and keeps full-text fallback search available.

Uploads, manual entries, crawler pages, and re-index actions enqueue indexing jobs. The worker processes them in the background while the Knowledge page shows queued, parsing, indexing, indexed, or failed status.

Arabic and RTL PDFs receive conservative text-direction cleanup during parsing. For scanned PDFs or PDFs with unusual embedded fonts, inspect chunks after upload and use OCR or a cleaner text version when needed.

Manual entries and FAQ entries are available at `/admin/knowledge/manual`. Website ingestion is available at `/admin/knowledge/crawler`.

## Embedding the Widget

Go to `/admin/embed` and copy:

```html
<script
  src="https://bot.organization.org/widget.js"
  data-bot-id="main">
</script>
```

Add the host website domain in `/admin/settings` before production use.

The embed page also provides a fully customizable example for frontend teams. It exposes supported `data-*` attributes and Shadow DOM `::part(...)` selectors for changing the launcher, panel, colors, quick actions, input, buttons, sizing, and mobile styling without changing TuwaiqX settings.

For local widget checks, use `/admin/test` after signing in, or embed the script on a temporary page outside the repository and add that page's host to the allowed domains in `/admin/settings`.

## Admin Dashboard

Important routes:

- `/admin/setup`
- `/admin/login`
- `/admin`
- `/admin/settings`
- `/admin/users`
- `/admin/models`
- `/admin/bots`
- `/admin/knowledge`
- `/admin/test`
- `/admin/embed`
- `/admin/conversations`
- `/admin/tickets`
- `/admin/analytics`
- `/admin/system`
- `/admin/audit-log`
- `/admin/backups`

## Backup and Restore

```bash
./scripts/backup.sh ./backups/tuwaiqx-$(date +%F)
./scripts/restore.sh ./backups/tuwaiqx-2026-06-12
```

Backups include PostgreSQL data and uploaded files where accessible.

## Updating

```bash
git pull
docker compose build
docker compose up -d
docker compose exec tuwaiqx-web npm run migrate:deploy
```

## Security Notes

- Set `AUTH_SECRET`.
- Put TuwaiqX behind HTTPS in production.
- Restrict `/admin` with network controls where possible.
- Configure allowed widget domains.
- Keep PostgreSQL, Redis, MinIO, Ollama, and LocalAI on a private network.
- Rotate provider keys through `/admin/models`.
- Keep backups encrypted and access controlled.

See `docs/security.md` for the full baseline threat model and hardening guide.

## Troubleshooting

- `/api/health` reports database, Redis, storage, and model checks.
- If Ollama is unavailable, strict-mode chat can still use indexed full-text retrieval but model answers require a working chat provider.
- If embeddings fail, chunks remain searchable through full-text fallback.
- Check `/admin/system`, `/admin/audit-log`, and document error messages.

## Contributing

Contributions should preserve the local-first, self-hosted, AGPL, no-SaaS-lock-in principles. Do not add billing, subscription logic, forced cloud dependencies, or artificial feature restrictions.
