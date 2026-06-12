# Model Providers

Provider adapters live in `src/lib/ai/providers`.

Required adapters:

- `ollama.ts`: local default provider for chat and embeddings.
- `openai-compatible.ts`: optional endpoint using OpenAI-compatible `/chat/completions` and `/embeddings`.
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

