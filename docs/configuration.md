# Configuration

TuwaiqX is configured through `.env` and the admin settings page.

Important variables:

- `APP_NAME`: defaults to `TuwaiqX`.
- `APP_URL`: public URL for the app and widget.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `STORAGE_DRIVER`: `local` or `s3`.
- `STORAGE_PATH`: local upload storage path when `STORAGE_DRIVER=local`.
- `S3_ENDPOINT`: S3-compatible endpoint when `STORAGE_DRIVER=s3`, such as a private MinIO or object-storage URL.
- `S3_ACCESS_KEY`: access key for S3-compatible storage. Leave empty only when the endpoint supports the server's default credentials.
- `S3_SECRET_KEY`: secret key for S3-compatible storage.
- `S3_BUCKET`: bucket name for uploaded documents when `STORAGE_DRIVER=s3`.
- `MODEL_STORAGE_PATH`: local directory for uploaded chat and embedding model files.
- `MAX_MODEL_UPLOAD_MB`: maximum size for a single model file upload.
- `AUTH_SECRET`: required in production.
- `DEFAULT_MODEL_PROVIDER`: `ollama`, `openai-compatible`, or `mock`.
- `OLLAMA_BASE_URL`: Ollama URL from the web container. Docker default is `http://ollama:11434`.
- `OLLAMA_CHAT_MODEL`: default Ollama chat model.
- `OLLAMA_EMBEDDING_MODEL`: default Ollama embedding model.
- `OLLAMA_CHAT_TIMEOUT_MS`: chat request timeout for slow local Ollama models. Default is `360000`.
- `OLLAMA_EMBEDDING_TIMEOUT_MS`: embedding request timeout for Ollama embedding models. Default is `120000`.
- `OLLAMA_CHAT_MIN_PREDICT`: minimum Ollama `num_predict` budget for chat requests. Default is `1024`, which gives thinking models enough room to produce a final answer.
- `OLLAMA_MAX_LOADED_MODELS`: Ollama model residency limit. Default Docker value is `2` so one chat model and one embedding model can stay warm.
- `EMBEDDING_CONCURRENCY`: number of chunk embedding requests processed at once during indexing. Default is `1`; increase carefully for local Ollama or LocalAI.
- `LOCAL_RUNTIME_BASE_URL`: default OpenAI-compatible URL for the optional local runtime profile. Docker default is `http://localai:8080/v1`.
- `LOCALAI_IMAGE_TAG`: LocalAI Docker image tag for `docker compose --profile local-models up -d`.
- `OPENAI_COMPATIBLE_BASE_URL`: optional external or local OpenAI-compatible endpoint.
- `RATE_LIMIT_ENABLED`: set to `false` to disable request rate limiting.
- `RATE_LIMIT_REDIS_FALLBACK`: `memory` or `deny` when Redis rate limiting is unavailable. Development defaults to memory fallback; production defaults to deny unless set.
- `CHAT_RATE_LIMIT_REQUESTS`: chat requests allowed per rate-limit window.
- `CHAT_RATE_LIMIT_WINDOW_MS`: chat rate-limit window in milliseconds.
- `SOURCE_CODE_URL`: shown in admin and widget footers.

The admin settings page controls organization name, website URL, colors, logo, language, direction, support email, policy links, source code URL, data retention, and allowed widget domains.

Uploaded model files are stored on the TuwaiqX server, not in S3. In Docker, the default path is `/data/models`; production installs can replace the named Docker volume with a bind mount such as `/opt/tuwaiqx/models:/data/models`.

When using `STORAGE_DRIVER=s3`, only uploaded knowledge documents are stored in the S3-compatible bucket. Keep the model file path persistent separately if `/admin/models` is used for uploaded local model files.

Docker Compose starts both `tuwaiqx-web` and `tuwaiqx-worker`. Manual non-Docker installs must run `npm run worker` alongside the web process so queued indexing jobs are processed.
