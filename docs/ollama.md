# Ollama

TuwaiqX works without paid AI APIs by using Ollama as the default provider.

```bash
docker compose --profile ollama up -d
docker compose exec tuwaiqx-ollama ollama pull llama3.1
docker compose exec tuwaiqx-ollama ollama pull nomic-embed-text
```

Configure:

```env
DEFAULT_MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3.1
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

In `/admin/models`, create or test an Ollama provider. Use a larger model if your server has enough memory.
