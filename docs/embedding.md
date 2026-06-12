# Embedding and Retrieval

TuwaiqX chunks approved knowledge, generates embeddings through the configured embedding provider, and stores vectors in PostgreSQL with pgvector.

The retrieval flow:

1. Validate the public chat request.
2. Resolve the bot.
3. Embed the user question.
4. Search approved chunks with pgvector.
5. Fall back to PostgreSQL full-text search if vector search is unavailable.
6. Build a RAG prompt with strict or flexible mode.
7. Store the conversation, messages, sources, feedback, and knowledge gaps.

If embedding generation fails, chunks are still saved and searchable through full-text fallback.

