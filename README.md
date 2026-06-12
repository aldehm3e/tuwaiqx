# TuwaiqX

TuwaiqX is a GNU AGPL self-hosted AI chatbot system for organizations. It lets NGOs, universities, charities, schools, and nonprofits run their own website assistant using their own server, documents, and model provider.

TuwaiqX is not a SaaS product, not a hosted subscription platform, and not a small MVP demo. It is a complete open-source package that an organization can clone from GitHub, install on its own server, connect to a local model such as Ollama or to an optional API-key model provider, upload its documents, configure its bot, and embed the bot into its own website.

Auther: Eng. Abdulrahman Alsaedi

## Features

- Next.js admin dashboard with first-run setup, local admin auth, RBAC, audit log, and system health.
- Ollama/local model support by default, plus optional OpenAI-compatible model providers.
- Clean provider interface for adding more model adapters.
- Document upload and indexing for PDF, DOCX, TXT, Markdown, HTML, CSV, XLSX, JSON, manual text, FAQ, and website crawling.
- Retrieval-augmented chat with pgvector search, full-text fallback, strict mode, citations, conversation logs, feedback, and knowledge gap tracking.
- Standalone embeddable `widget.js` with Shadow DOM, localStorage conversation continuity, RTL/LTR support, quick actions, sources, and feedback.
- Built-in tickets/handoff, local forms/workflows, local analytics, CSV/JSON-oriented APIs, backup/restore scripts, and documentation for self-hosting.

## License

TuwaiqX is licensed under GNU AGPL-3.0-or-later for the main application.

## Requirements

- Docker and Docker Compose
- Node.js 20 for local development
- PostgreSQL with pgvector, Redis, and local or S3-compatible storage
- Optional: Ollama for fully local model execution

## Quick Start

```bash
git clone https://github.com/YOUR_ORG/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
docker compose up -d
```

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
docker compose exec tuwaiqx-ollama ollama pull llama3.1
docker compose exec tuwaiqx-ollama ollama pull nomic-embed-text
```

## Configuration

Use `.env.example` as the baseline. The default database settings are:

```env
APP_NAME=TuwaiqX
DATABASE_URL=postgresql://tuwaiqx:tuwaiqx@postgres:5432/tuwaiqx
SOURCE_CODE_URL=https://github.com/YOUR_ORG/tuwaiqx
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

Seed data creates the demo organization `Peaceful Aid NGO`, the Main Website Assistant, Volunteer Assistant, Donation Assistant, Support Assistant, English and Arabic knowledge samples, and a volunteer form. It is optional and not required for production.

## Model Providers

The default path is Ollama:

```env
DEFAULT_MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3.1
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Optional OpenAI-compatible endpoints are configured in the admin dashboard or `.env`. TuwaiqX does not hardcode one paid vendor.

## Uploading Documents

Go to `/admin/knowledge/upload` and upload supported files. TuwaiqX stores the original file, parses text, chunks content, generates embeddings when a provider is available, stores chunks in pgvector, and keeps full-text fallback search available.

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
- `/admin/forms`
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
