# AGENTS.md

## Project Identity

This repository is **TuwaiqX**.

- Repository name: `tuwaiqx`
- App name: `TuwaiqX`
- Package name: `tuwaiqx`
- Docker project name: `tuwaiqx`
- Database name/user for Docker installs: `tuwaiqx`
- Default source URL: `https://github.com/YOUR_ORG/tuwaiqx`
- Main license: `AGPL-3.0-or-later`

Do not introduce any previous project name or alternate product branding anywhere in code, documentation, UI, seed data, scripts, package metadata, Docker config, or generated examples.

## Product Definition

TuwaiqX is a complete standalone self-hosted chatbot solution for NGOs, universities, charities, schools, public organizations, and nonprofits.

TuwaiqX is not a SaaS product, not a hosted subscription platform, and not an MVP demo. It is a full open-source package that an organization can clone, install on its own server, connect to Ollama or an optional OpenAI-compatible model provider, upload documents, configure bots, and embed a widget into its own website.

## Expected User Flow

```bash
git clone https://github.com/YOUR_ORG/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
docker compose up -d
```

The organization opens `/admin`, completes setup, configures branding/domains/model provider, uploads documents, waits for indexing, tests the bot, copies the widget embed code, and pastes it into its own website.

Example widget:

```html
<script
  src="https://bot.organization.org/widget.js"
  data-bot-id="main">
</script>
```

Widget footer text must be:

```text
Powered by TuwaiqX
```

Admin dashboard title should be:

```text
TuwaiqX Admin
```

## Local Test Environment Policy

The product source lives at:

```text
C:\Users\Fluent\Desktop\Projects\TuwaiqX
```

Do not treat that folder as the user's personal install. Keep test installs separate, for example:

```text
C:\Users\Fluent\Desktop\TuwaiqX-Test
```

The source repo should stay clean and community-ready. User-specific `.env`, database state, uploaded files, and experiments belong in the separate test install or ignored `tmp` data.

Recommended test-copy command:

```powershell
robocopy C:\Users\Fluent\Desktop\Projects\TuwaiqX C:\Users\Fluent\Desktop\TuwaiqX-Test /E /XD node_modules .next tmp .git /XF .env tsconfig.tsbuildinfo
```

## Current Machine Notes

The user has Ollama installed locally. Docker Desktop was installed, but Docker cannot currently start because Windows virtualization support is not detected. Docker-based testing requires enabling virtualization in BIOS/UEFI and WSL2, then confirming:

```powershell
docker run --rm hello-world
```

Until that works, Docker Compose installs will fail before TuwaiqX starts.

When Docker works and the user wants to use local Ollama rather than Docker Ollama, set this in the test install `.env`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Then start without the Ollama profile:

```powershell
docker compose up -d
```

## Seed Data

Seed data should use:

- Organization: `Peaceful Aid NGO`
- Main bot: `Main Website Assistant`
- Example bots:
  - `Volunteer Assistant`
  - `Donation Assistant`
  - `Support Assistant`

Do not seed anything using older branding.

## Verification Before Handover

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Final name check:

```powershell
rg -n -S "old project name patterns" --hidden -g "!node_modules/**"
```

Use the concrete historical strings from the user request when running the check, but do not add them to repository files.

## Engineering Notes

- Prefer existing Next.js App Router, Prisma, BullMQ, Redis, pgvector, and provider-adapter patterns.
- Keep Docker service names as `tuwaiqx-web`, `tuwaiqx-postgres`, `tuwaiqx-redis`, `tuwaiqx-minio`, and `tuwaiqx-ollama`.
- `.env.example` should keep the documented TuwaiqX defaults.
- The widget is standalone and lives at `public/widget.js`.
- Keep the project local-first and self-hosted. Do not add billing, subscriptions, forced cloud dependencies, or artificial feature restrictions.
