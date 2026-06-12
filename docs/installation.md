# Installation

## Docker Compose

```bash
git clone https://github.com/YOUR_ORG/tuwaiqx.git
cd tuwaiqx
cp .env.example .env
docker compose up -d
```

Open `http://localhost:3000/admin` and complete the first-run setup.

## Optional Ollama

```bash
docker compose --profile ollama up -d
docker compose exec tuwaiqx-ollama ollama pull llama3.1
docker compose exec tuwaiqx-ollama ollama pull nomic-embed-text
```

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
