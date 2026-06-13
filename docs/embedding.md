# Embedding and Retrieval

TuwaiqX chunks approved knowledge, generates embeddings through the configured embedding provider, and stores vectors in PostgreSQL with pgvector.

The retrieval flow:

1. Validate the public chat request.
2. Resolve the bot.
3. Resolve the response language from the user's question, widget language, and bot language.
4. Embed the user question with the bot embedding provider, default embedding provider, or fallback provider.
5. Search approved chunks with pgvector.
6. Fall back to PostgreSQL full-text search if vector search is unavailable.
7. Build a RAG prompt with strict or flexible mode.
8. Store the conversation, messages, sources, feedback, and knowledge gaps.

If embedding generation fails, chunks are still saved and searchable through full-text fallback.

Arabic questions are answered in Arabic unless the user explicitly asks for another language. This server-side language detection is applied even when a widget or test client sends a different language value.

When changing the embedding provider or embedding model, run `Re-index` for affected documents or `Re-index all` from `/admin/knowledge`. Different embedding models can produce different vector spaces or dimensions, so old vectors should not be reused.
