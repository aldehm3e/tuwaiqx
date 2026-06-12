# Configuration

TuwaiqX is configured through `.env` and the admin settings page.

Important variables:

- `APP_NAME`: defaults to `TuwaiqX`.
- `APP_URL`: public URL for the app and widget.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `STORAGE_DRIVER`: `local` or `s3`.
- `STORAGE_PATH`: local upload storage path when `STORAGE_DRIVER=local`.
- `MODEL_STORAGE_PATH`: local directory for uploaded chat and embedding model files.
- `MAX_MODEL_UPLOAD_MB`: maximum size for a single model file upload.
- `AUTH_SECRET`: required in production.
- `DEFAULT_MODEL_PROVIDER`: `ollama`, `openai-compatible`, or `mock`.
- `OLLAMA_BASE_URL`: Ollama URL from the web container. Docker default is `http://ollama:11434`.
- `OLLAMA_CHAT_MODEL`: default Ollama chat model.
- `OLLAMA_EMBEDDING_MODEL`: default Ollama embedding model.
- `LOCAL_RUNTIME_BASE_URL`: default OpenAI-compatible URL for the optional local runtime profile. Docker default is `http://localai:8080/v1`.
- `LOCALAI_IMAGE_TAG`: LocalAI Docker image tag for `docker compose --profile local-models up -d`.
- `OPENAI_COMPATIBLE_BASE_URL`: optional external or local OpenAI-compatible endpoint.
- `SOURCE_CODE_URL`: shown in admin and widget footers.

The admin settings page controls organization name, website URL, colors, logo, language, direction, support email, policy links, source code URL, data retention, and allowed widget domains.

Uploaded model files are stored on the TuwaiqX server. In Docker, the default path is `/data/models`; production installs can replace the named Docker volume with a bind mount such as `/opt/tuwaiqx/models:/data/models`.
