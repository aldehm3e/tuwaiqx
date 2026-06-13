# Admin Guide

## First Run

Open `/admin/setup`, create the owner account, configure organization settings, allowed domains, and a model provider.

The first account is assigned the `Owner` role. Owner users can manage users, system settings, models, bots, knowledge, tickets, conversations, and analytics.

## Knowledge

Use `/admin/knowledge/upload` for files, `/admin/knowledge/manual` for manual text and FAQ entries, and `/admin/knowledge/crawler` for public website pages.

Use `Re-index` on one document, or `Re-index all` from the Knowledge page, after changing the embedding provider or embedding model. Re-indexing rebuilds chunks and embeddings with the current provider so retrieval uses the latest model.

Manual text is best for longer reference material. FAQ entries are best for common direct questions because TuwaiqX stores a separate question field and can return an exact answer before semantic search.

Knowledge gaps are recorded when the bot cannot answer from approved knowledge. Use them as a queue for missing content.

## Models

Use `/admin/models` to connect model providers and manage uploaded model files.

Supported provider paths:

- Ollama API.
- OpenAI-compatible API or runtime.
- Local runtimes such as LM Studio, llama.cpp server, LocalAI, vLLM, or SGLang.
- Uploaded model files that a separate runtime loads from disk.

TuwaiqX does not execute uploaded model weights inside the web app. Uploading a model stores it and, for `.gguf` files, writes LocalAI config metadata. Start a runtime, add its `/v1` URL as an OpenAI-compatible provider, then test and re-index knowledge.

Chat and embedding providers can be separate. If you change the embedding provider or embedding model, re-index knowledge before relying on retrieval quality.

## Bots

Create bots at `/admin/bots/new`. Configure strict mode, source display, prompt, provider, language, direction, widget color, quick actions, and embed position.

Use `/admin/embed` after creating a bot. Each bot shows a default script for a simple install and a fully customizable embed example for frontend teams that need to control the launcher, panel, colors, quick actions, input, buttons, mobile sizing, and exposed Shadow DOM parts.

## Conversations and Gaps

Conversation logs are in `/admin/conversations`. Fallbacks create knowledge gaps visible through analytics and dashboard counts.

Analytics feedback counts are totals across assistant messages. The Analytics page also lists recent feedback with rating, bot, user question, answer preview, and a conversation link.

## Tickets

Tickets are available in `/admin/tickets`. The ticket detail page supports status changes, assignment, priority updates, linked conversation review, and manual ticket creation. Chat fallback or explicit handoff requests can automatically create a ticket for the conversation.

## Users and Permissions

Use `/admin/users` to create admin users, assign roles, disable access, enable access, or delete users. Deleting a user removes the admin account while related audit logs, tickets, documents, and notes keep their history through nullable references.

Users cannot change their own account access, and TuwaiqX prevents removing the last active user with user-management permission.

If a role opens a page or triggers an action it is not allowed to use, the admin UI shows a clear not-allowed page or a role-specific API error.
