# Ollama

TuwaiqX works without paid AI APIs by using Ollama as the default provider.

```bash
docker compose --profile ollama up -d
docker compose exec tuwaiqx-ollama ollama pull <chat-model>
docker compose exec tuwaiqx-ollama ollama pull <embedding-model>
```

Configure:

```env
DEFAULT_MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=<chat-model>
OLLAMA_EMBEDDING_MODEL=<embedding-model>
```

Use any compatible chat and embedding models supported by the Ollama runtime. Re-index knowledge after changing embedding models so stored vectors match the active embedding provider.

For Docker deployments that use both chat and embedding models, keep `OLLAMA_MAX_LOADED_MODELS=2` so Ollama can keep both models warm instead of unloading and reloading them for every request.

If a large local model fails while loading or generating, Ollama may be running out of memory inside Docker. Increase Docker Desktop memory, enable GPU support, or use a smaller model. For slow but otherwise healthy local models, increase `OLLAMA_CHAT_TIMEOUT_MS`. If a thinking model returns no final answer, increase `OLLAMA_CHAT_MIN_PREDICT`.

In `/admin/models`, create or test an Ollama provider. Use a larger model if your server has enough memory.
