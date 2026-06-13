# Developer Guide

## Structure

- `app/`: Next.js App Router pages and route handlers.
- `src/lib/auth`: local authentication, sessions, RBAC.
- `src/lib/ai`: provider interfaces and adapters.
- `src/lib/documents`: storage, parsing, crawling, indexing.
- `src/lib/rag`: chunking, retrieval, prompt building, answers.
- `src/lib/jobs`: BullMQ queue and worker entrypoint.
- `src/lib/security`: rate limiting, origin checks, secret encryption.
- `public/widget.js`: standalone embeddable widget.
- `prisma/schema.prisma`: application schema.

## Public API

- `POST /api/chat`
- `GET /api/widget/config?botId=main`
- `POST /api/chat/feedback`
- `GET /api/health`
- `GET /api/version`

## Admin API

- `POST /api/admin/setup`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `PUT /api/admin/settings`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `POST /api/admin/providers`
- `POST /api/admin/model-files`
- `DELETE /api/admin/model-files/:id`
- `POST /api/admin/bots`
- `PUT /api/admin/bots/:id`
- `DELETE /api/admin/bots/:id`
- `POST /api/admin/bots/:id/duplicate`
- `POST /api/admin/documents/upload`
- `POST /api/admin/documents/manual`
- `POST /api/admin/documents/crawler`
- `POST /api/admin/documents/reindex`
- `POST /api/admin/documents/:id/reindex`
- `POST /api/admin/tickets`
- `PATCH /api/admin/tickets/:id`

All admin routes require local admin authentication and permission checks.

Page-level permission failures redirect to `/admin/not-authorized`. API permission failures return HTTP `403` with a role-specific error message.
