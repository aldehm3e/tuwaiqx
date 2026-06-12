# Configuration

TuwaiqX is configured through `.env` and the admin settings page.

Important variables:

- `APP_NAME`: defaults to `TuwaiqX`.
- `APP_URL`: public URL for the app and widget.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `STORAGE_DRIVER`: `local` or `s3`.
- `AUTH_SECRET`: required in production.
- `DEFAULT_MODEL_PROVIDER`: `ollama`, `openai-compatible`, or `mock`.
- `SOURCE_CODE_URL`: shown in admin and widget footers.

The admin settings page controls organization name, website URL, colors, logo, language, direction, support email, policy links, source code URL, data retention, and allowed widget domains.
