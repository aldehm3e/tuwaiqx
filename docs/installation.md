# Installation

## Is Docker Required?

Docker is not technically required, but it is the recommended production path for TuwaiqX.

With Docker Compose, one command starts the full stack:

- TuwaiqX web app
- PostgreSQL with pgvector
- Redis
- local upload/model storage
- optional Ollama
- optional LocalAI runtime for uploaded `.gguf` model files

Without Docker, the same pieces must be installed and maintained manually: Node.js 20, PostgreSQL 16, pgvector, Redis, storage directories or S3-compatible storage, Prisma migrations, a process manager such as systemd or PM2, a reverse proxy, and an optional model runtime.

For a university server, use Docker Compose unless the IT policy does not allow Docker.

## Dedicated University Server Flow

Use this flow when the university gives you one server and you want to deliver many chatbots to different university websites from the same TuwaiqX installation.

### 1. Request The Server

Minimum for testing:

```text
Ubuntu 22.04 or 24.04
8 CPU cores
32 GB RAM
200 GB SSD
Docker and Docker Compose
Public subdomain
SSH access
HTTPS access
```

Better for real local AI models:

```text
16+ CPU cores
64 GB RAM
500 GB - 1 TB SSD
NVIDIA GPU if running stronger local models
```

### 2. Request A Domain

Ask IT for a subdomain such as:

```text
ai.university.edu
```

The admin dashboard will be:

```text
https://ai.university.edu/admin
```

The widget script will be:

```text
https://ai.university.edu/widget.js
```

### 3. Open Only Required Public Ports

Public:

```text
80   HTTP
443  HTTPS
22   SSH, restricted to trusted admins if possible
```

Do not expose PostgreSQL, Redis, MinIO, Ollama, or LocalAI ports publicly.

### 4. Connect To The Server

```bash
ssh your-user@ai.university.edu
```

### 5. Verify Docker

If Docker is already installed:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

### 6. Clone TuwaiqX

```bash
cd /opt
sudo git clone https://github.com/aldehm3e/tuwaiqx.git
sudo chown -R $USER:$USER tuwaiqx
cd tuwaiqx
```

### 7. Create `.env`

```bash
cp .env.example .env
nano .env
```

Set at least:

```env
APP_NAME=TuwaiqX
APP_URL=https://ai.university.edu
AUTH_SECRET=PUT_A_LONG_RANDOM_SECRET_HERE
SOURCE_CODE_URL=https://github.com/aldehm3e/tuwaiqx
```

Generate a strong secret:

```bash
openssl rand -base64 48
```

### 8. Choose The Model Runtime

For the simplest fully local Docker setup, use the Ollama profile:

```env
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Then start the stack with Ollama and pull the models:

```bash
docker compose --profile ollama up -d --build
docker compose exec tuwaiqx-ollama ollama pull qwen2.5:0.5b
docker compose exec tuwaiqx-ollama ollama pull nomic-embed-text
```

For better Arabic production quality, use stronger Arabic-capable chat and embedding models if the server hardware supports them.

If using an external or separately managed OpenAI-compatible runtime, start TuwaiqX without the Ollama profile:

```bash
docker compose up -d --build
```

Then add that runtime from `/admin/models` as an `OpenAI-compatible/runtime` provider.

### 9. Check Health

```bash
curl http://localhost:3000/api/health
```

The response should report healthy database, Redis, storage, and model provider checks.

### 10. Add HTTPS

Ask IT to put Nginx, Caddy, Traefik, or the university load balancer in front of:

```text
http://localhost:3000
```

The public URL should be:

```text
https://ai.university.edu
```

### 11. Complete First-Run Setup

Open:

```text
https://ai.university.edu/admin
```

Create the first admin user and configure:

- organization name
- website URL
- allowed domains
- language and direction
- brand colors
- model provider

### 12. Create Many Bots

One TuwaiqX installation can serve many bots. Each bot can have its own slug, documents, language, direction, welcome message, fallback message, quick actions, strictness, and model provider.

Example bot slugs:

```text
admissions
registration
library
student-affairs
scholarships
```

### 13. Add Allowed Widget Domains

In `/admin/settings`, add every website that may embed a bot:

```text
admissions.university.edu
library.university.edu
studentaffairs.university.edu
main.university.edu
```

### 14. Embed Each Bot

Admissions website:

```html
<script
  src="https://ai.university.edu/widget.js"
  data-bot-id="admissions">
</script>
```

Library website:

```html
<script
  src="https://ai.university.edu/widget.js"
  data-bot-id="library">
</script>
```

## Quick Docker Compose Install

```bash
git clone https://github.com/aldehm3e/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
docker compose up -d
```

Open `http://localhost:3000/admin` and complete the first-run setup.

## Optional Ollama Profile

```bash
docker compose --profile ollama up -d
docker compose exec tuwaiqx-ollama ollama pull llama3.1
docker compose exec tuwaiqx-ollama ollama pull nomic-embed-text
```

## Optional Local Model Files

`/admin/models` can store downloaded chat and embedding model files under `MODEL_STORAGE_PATH`.

Docker defaults to a named volume mounted at `/data/models`. For production, you can use a bind mount such as `/opt/tuwaiqx/models:/data/models` when you want a known server directory that can also be mounted into a local inference runtime.

To run uploaded `.gguf` files with the bundled LocalAI profile:

```bash
docker compose --profile local-models up -d
```

Then open `/admin/models`, upload the chat and embedding model files, copy the generated LocalAI model names, and add an `OpenAI-compatible/runtime` provider with:

```text
http://localai:8080/v1
```

## Manual Install Without Docker

Only use this path if the university cannot provide Docker.

Install and manage these services yourself:

- Node.js 20
- PostgreSQL 16
- pgvector extension
- Redis
- local storage directory or S3-compatible storage
- Ollama, LocalAI, llama.cpp server, vLLM, or another model runtime
- Nginx, Caddy, or another reverse proxy
- systemd or PM2 for the TuwaiqX process

Basic manual flow:

```bash
git clone https://github.com/aldehm3e/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
npm install
npm run prisma:generate
npm run migrate:deploy
npm run build
npm run start
```

In `.env`, point `DATABASE_URL`, `REDIS_URL`, `STORAGE_PATH`, and the model provider URLs to the services installed on the server.

## Local Development

```bash
npm install
npm run prisma:generate
npm run migrate:dev
npm run seed
npm run dev
```

## Production Checklist

- Set `AUTH_SECRET`.
- Use HTTPS through a reverse proxy.
- Configure backups.
- Configure allowed widget domains.
- Pull local models before relying on Ollama.
- Mount a persistent `MODEL_STORAGE_PATH` if using uploaded local model files.
- Do not expose database, Redis, Ollama, or LocalAI ports publicly.
- Back up PostgreSQL, uploaded documents, and model files.
- OCR scanned/image-only PDFs before upload.
