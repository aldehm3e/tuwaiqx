# Installation

## Docker Compose

```bash
git clone https://github.com/aldehm3e/tuwaiqx.git
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

## Optional local model files

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
