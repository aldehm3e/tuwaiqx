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

For a fuller no-Ollama path, see [Install Without Ollama](#install-without-ollama).

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

## Install Without Ollama

Use this path when the organization does not want Ollama at all.

TuwaiqX can run without Ollama if you provide another chat and embedding provider. The provider can be:

- an OpenAI-compatible local runtime such as LocalAI, llama.cpp server, or vLLM
- an OpenAI-compatible API endpoint on another university server
- an optional external API provider, if the organization policy allows it

### Docker Compose Without Ollama

Do not start the Ollama profile. Start only the main stack:

```bash
docker compose up -d --build
```

In `.env`, set the default provider to OpenAI-compatible if you want `/api/health` to check that provider before setup:

```env
DEFAULT_MODEL_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=https://your-runtime.example.edu/v1
OPENAI_COMPATIBLE_API_KEY=CHANGE_THIS_IF_REQUIRED
OPENAI_COMPATIBLE_CHAT_MODEL=your-chat-model
OPENAI_COMPATIBLE_EMBEDDING_MODEL=your-embedding-model
```

If the runtime is inside the same Docker network, use its service name. For example, with the optional LocalAI profile:

```env
DEFAULT_MODEL_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=http://localai:8080/v1
OPENAI_COMPATIBLE_CHAT_MODEL=tuwaiqx-chat-your-model-id
OPENAI_COMPATIBLE_EMBEDDING_MODEL=tuwaiqx-embedding-your-model-id
```

Then start LocalAI instead of Ollama:

```bash
docker compose --profile local-models up -d --build
```

Open `/admin/setup` and choose:

```text
Provider type: OpenAI-compatible/runtime
Base URL: https://your-runtime.example.edu/v1
Chat model: your-chat-model
Embedding model: your-embedding-model
API key: only if required by the runtime
```

After setup, `/api/health` checks the configured default provider from the admin settings.

### Manual Install Without Ollama

In a manual non-Docker install, skip the Ollama installation and point TuwaiqX to another runtime:

```env
DEFAULT_MODEL_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=http://127.0.0.1:8080/v1
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_CHAT_MODEL=your-chat-model
OPENAI_COMPATIBLE_EMBEDDING_MODEL=your-embedding-model
```

Then restart TuwaiqX:

```bash
sudo systemctl restart tuwaiqx
```

If the runtime is on another server, use its private network URL and make sure the TuwaiqX server can reach it. Do not expose the runtime publicly unless the university secures it with authentication, firewall rules, and HTTPS.

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

Only use this path if the university cannot provide Docker. This is a valid deployment path, but it has more moving parts because the operating system owns PostgreSQL, pgvector, Redis, Node.js, storage, process management, and the model runtime.

These steps assume Ubuntu 22.04 or 24.04 and a public domain such as `ai.university.edu`. Adjust package names if the university uses another Linux distribution or an internal package mirror.

### 1. Install Base Packages

```bash
sudo apt update
sudo apt install -y git curl build-essential openssl nginx redis-server
```

Enable Redis:

```bash
sudo systemctl enable --now redis-server
```

### 2. Install Node.js 20

Use the university-approved Node.js package source. If the server has Node.js already, verify:

```bash
node -v
npm -v
```

TuwaiqX expects Node.js 20.

### 3. Install PostgreSQL And pgvector

Install PostgreSQL 16 and the pgvector extension package from the university-approved package source:

```bash
sudo apt install -y postgresql-16 postgresql-16-pgvector
sudo systemctl enable --now postgresql
```

If `postgresql-16-pgvector` is not available in the server package repositories, ask IT to install pgvector for PostgreSQL 16 or build pgvector from source.

Create the database and user:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER tuwaiqx WITH PASSWORD 'CHANGE_THIS_DATABASE_PASSWORD';
CREATE DATABASE tuwaiqx OWNER tuwaiqx;
\c tuwaiqx
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 4. Create The TuwaiqX System User And Storage Directories

```bash
sudo useradd --system --create-home --shell /bin/bash tuwaiqx
sudo mkdir -p /opt/tuwaiqx /var/lib/tuwaiqx/uploads /var/lib/tuwaiqx/models
sudo chown -R tuwaiqx:tuwaiqx /opt/tuwaiqx /var/lib/tuwaiqx
```

### 5. Clone The Repository

```bash
sudo -H -u tuwaiqx git clone https://github.com/aldehm3e/tuwaiqx.git /opt/tuwaiqx
cd /opt/tuwaiqx
```

### 6. Create `.env`

```bash
sudo -H -u tuwaiqx cp .env.example .env
sudo -H -u tuwaiqx nano .env
```

Set at least:

```env
APP_NAME=TuwaiqX
APP_URL=https://ai.university.edu
DATABASE_URL=postgresql://tuwaiqx:CHANGE_THIS_DATABASE_PASSWORD@localhost:5432/tuwaiqx
REDIS_URL=redis://localhost:6379
STORAGE_DRIVER=local
STORAGE_PATH=/var/lib/tuwaiqx/uploads
MODEL_STORAGE_PATH=/var/lib/tuwaiqx/models
AUTH_SECRET=PUT_A_LONG_RANDOM_SECRET_HERE
SOURCE_CODE_URL=https://github.com/aldehm3e/tuwaiqx
```

Generate a strong `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

### 7. Install Dependencies, Run Migrations, And Build

```bash
cd /opt/tuwaiqx
sudo -H -u tuwaiqx npm ci
sudo -H -u tuwaiqx npm run prisma:generate
sudo -H -u tuwaiqx npm run migrate:deploy
sudo -H -u tuwaiqx npm run build
```

### 8. Run TuwaiqX With systemd

Find the npm path:

```bash
which npm
```

Create the service:

```bash
sudo tee /etc/systemd/system/tuwaiqx.service >/dev/null <<'EOF'
[Unit]
Description=TuwaiqX self-hosted chatbot platform
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=tuwaiqx
Group=tuwaiqx
WorkingDirectory=/opt/tuwaiqx
EnvironmentFile=/opt/tuwaiqx/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

If `which npm` returned a different path, replace `/usr/bin/npm` in the service file.

Start TuwaiqX:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tuwaiqx
sudo systemctl status tuwaiqx
```

Read logs:

```bash
sudo journalctl -u tuwaiqx -f
```

### 9. Add A Reverse Proxy

Example Nginx HTTP proxy:

```nginx
server {
    listen 80;
    server_name ai.university.edu;

    client_max_body_size 8G;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Save it as `/etc/nginx/sites-available/tuwaiqx`, enable it, and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tuwaiqx /etc/nginx/sites-enabled/tuwaiqx
sudo nginx -t
sudo systemctl reload nginx
```

Add HTTPS with the university certificate process, Caddy, Certbot, or the university load balancer.

### 10. Add A Model Runtime

TuwaiqX needs a model provider for chat and embeddings. In a manual install, the runtime is managed outside TuwaiqX.

For Ollama on the same server, install Ollama using the university-approved method, then:

```bash
ollama pull qwen2.5:0.5b
ollama pull nomic-embed-text
```

Set:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Then restart TuwaiqX:

```bash
sudo systemctl restart tuwaiqx
```

For LocalAI, llama.cpp server, vLLM, or another runtime, expose an OpenAI-compatible URL on the server or private network, then add it in `/admin/models` as an `OpenAI-compatible/runtime` provider.

If the organization does not want Ollama, skip the Ollama commands and use the OpenAI-compatible settings from [Install Without Ollama](#install-without-ollama).

### 11. Check Health

```bash
curl http://localhost:3000/api/health
```

Then open:

```text
https://ai.university.edu/admin
```

Complete first-run setup, create bots, upload knowledge, test each bot, and embed the widget.

### 12. Manual Update Flow

```bash
cd /opt/tuwaiqx
sudo -H -u tuwaiqx git pull
sudo -H -u tuwaiqx npm ci
sudo -H -u tuwaiqx npm run prisma:generate
sudo -H -u tuwaiqx npm run migrate:deploy
sudo -H -u tuwaiqx npm run build
sudo systemctl restart tuwaiqx
```

### 13. Manual Backup Targets

Back up:

- PostgreSQL database `tuwaiqx`
- `/opt/tuwaiqx/.env`
- `/var/lib/tuwaiqx/uploads`
- `/var/lib/tuwaiqx/models`
- any external model runtime configuration

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
- If not using Ollama, configure an OpenAI-compatible/runtime provider before production testing.
- Mount a persistent `MODEL_STORAGE_PATH` if using uploaded local model files.
- Do not expose database, Redis, Ollama, or LocalAI ports publicly.
- Back up PostgreSQL, uploaded documents, and model files.
- OCR scanned/image-only PDFs before upload.
