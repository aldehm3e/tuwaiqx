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

Recommended combinations:

- Stable: `qwen3:30b` for chat and `nomic-embed-text` for embeddings.
- Multilingual advanced: `qwen3:30b` for chat and `bge-m3` for embeddings.

`nomic-embed-text` returns 768-dimensional embeddings. `bge-m3` returns 1024-dimensional embeddings. Re-index knowledge after changing embedding models so stored vectors match the active embedding provider.

For `qwen3:30b` plus an embedding model in Docker, give Docker Desktop enough memory and keep `OLLAMA_MAX_LOADED_MODELS=2` so Ollama can keep both models warm instead of unloading and reloading the large chat model for every request.

If `qwen3:30b` fails with `llama-server process has terminated: signal: killed`, Ollama is usually running out of memory inside Docker while loading the chat model. Increase Docker Desktop memory, enable GPU support, or use a smaller chat model. For slow but otherwise healthy local models, increase `OLLAMA_CHAT_TIMEOUT_MS`. If qwen returns thinking but no final answer, increase `OLLAMA_CHAT_MIN_PREDICT`.

In `/admin/models`, create or test an Ollama provider. Use a larger model if your server has enough memory.
