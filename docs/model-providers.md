# Model Providers

Provider adapters live in `src/lib/ai/providers`.

Current adapters:

- `ollama.ts`: local default provider for chat and embeddings.
- `openai-compatible.ts`: endpoint using OpenAI-compatible `/chat/completions`, `/embeddings`, and `/models`.
- `mock.ts`: deterministic provider for tests and development.

Provider interface:

- `ChatProvider`
- `EmbeddingProvider`
- `ModelProviderConfig`
- `ChatCompletionRequest`
- `ChatCompletionResponse`
- `EmbeddingRequest`
- `EmbeddingResponse`

Do not hardcode one paid vendor. Add new providers by implementing the interfaces and registering them in `src/lib/ai/factory.ts`.

## Admin Configuration

Providers are configured in `/admin/models`.

Use `Ollama API` when the runtime exposes Ollama routes such as `/api/chat`, `/api/embeddings`, and `/api/tags`.

Use `OpenAI-compatible API/runtime` for external APIs or local runtimes such as LM Studio, llama.cpp server, LocalAI, vLLM, or SGLang. The base URL should end at the API root, for example:

```text
http://127.0.0.1:1234/v1
http://127.0.0.1:8080/v1
http://host.docker.internal:1234/v1
```

If TuwaiqX runs in Docker and the runtime runs directly on Windows or the host OS, use `host.docker.internal` instead of `127.0.0.1`.

Chat and embedding can be configured as separate providers. The default embedding provider is used for indexing and retrieval. Bot-specific embedding providers override the installation default.

After changing an embedding provider or embedding model, re-index knowledge.
