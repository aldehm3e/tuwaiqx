# Security

## Threat Model

TuwaiqX stores organization documents, conversations, tickets, form submissions, model provider credentials, and admin accounts. Main risks include unauthorized admin access, public endpoint abuse, prompt injection through documents or chat messages, data leakage through widget domains, unsafe uploads, and backup exposure.

## Baseline Controls

- Local admin authentication with password hashing.
- Signed HTTP-only session cookies.
- RBAC permissions for system, users, bots, knowledge, conversations, tickets, analytics, and integrations.
- Zod validation on public and admin inputs.
- Public chat rate limiting.
- Allowed domain checks for widget and public form APIs.
- File type and size validation.
- Safe generated storage keys.
- No uploaded file execution.
- Admin audit log.
- Provider keys encrypted at rest with `AUTH_SECRET`.
- No billing or SaaS account dependency.

## HTTPS

Run TuwaiqX behind a reverse proxy such as Caddy, Nginx, Traefik, or Apache. Terminate HTTPS at the proxy and forward to `tuwaiqx-web:3000`.

Set:

```env
APP_URL=https://bot.organization.org
AUTH_SECRET=<long random secret>
```

## Secret Rotation

1. Add a new provider key in `/admin/models`.
2. Test provider health.
3. Update bots to use the new provider.
4. Disable the old provider.

Rotating `AUTH_SECRET` invalidates sessions and makes existing encrypted provider secrets unreadable. Re-enter provider keys after rotation.

## Admin Access

Use strong passwords, limit admin accounts, disable unused users, and restrict `/admin` with network controls where practical.

## Backups

Encrypt backups, store them separately, and test restores. Backups contain sensitive documents and conversations.
