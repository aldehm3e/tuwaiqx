# Local model files

TuwaiqX can store downloaded chat and embedding model files on the server through `/admin/models`.

Uploading a model file does not run the model. A separate runtime must load the uploaded file and expose an API that TuwaiqX can call.

Supported upload formats:

- `.gguf`
- `.ggml`
- `.bin`
- `.safetensors`
- `.onnx`
- `.model`

The default Docker path is:

```env
MODEL_STORAGE_PATH=/data/models
MAX_MODEL_UPLOAD_MB=8000
```

Docker Compose mounts that path with the `models` named volume. Production installs can use a bind mount instead, for example:

```yaml
volumes:
  - /opt/tuwaiqx/models:/data/models
```

## Runtime

TuwaiqX stores and manages model files, but it does not execute model weights inside the Next.js web process. Run the uploaded files with a local inference runtime such as LocalAI, llama.cpp server, LM Studio, vLLM, SGLang, or another OpenAI-compatible server.

### Optional LocalAI profile

Docker installs can start a bundled LocalAI runtime profile:

```bash
docker compose --profile local-models up -d
```

The LocalAI container mounts the same `models` volume at `/models`. When a `.gguf` chat or embedding file is uploaded, TuwaiqX writes a LocalAI config file beside it:

```text
/data/models/localai-<model-file-id>.yaml
```

The generated runtime model name is shown in `/admin/models`:

```text
tuwaiqx-chat-<model-file-id>
tuwaiqx-embedding-<model-file-id>
```

Add a provider in `/admin/models` with:

```text
Type: OpenAI-compatible/runtime
Base URL: http://localai:8080/v1
Chat model: tuwaiqx-chat-<model-file-id>
Embedding model: tuwaiqx-embedding-<model-file-id>
```

Use `LOCALAI_IMAGE_TAG` to switch LocalAI images, for example a GPU-specific tag from the LocalAI project. Non-GGUF formats are still stored by TuwaiqX, but they may need manual runtime configuration in LocalAI, vLLM, llama.cpp server, or another runtime.

### External or Windows runtime

After any runtime loads the model file:

1. Open `/admin/models`.
2. Add a provider with type `OpenAI-compatible/runtime`.
3. Set the base URL to the local runtime endpoint.
4. Set the chat and embedding model names used by that runtime.
5. Click `Retest`.
6. Mark it as the default chat and/or embedding provider.

For Windows runtimes on the same machine as a Docker-based TuwaiqX install, use:

```text
http://host.docker.internal:<port>/v1
```

For manual non-Docker installs where TuwaiqX and the runtime are both on the same Windows host, use:

```text
http://127.0.0.1:<port>/v1
```

If chat and embedding run on separate ports, create separate providers and mark one as default chat and the other as default embeddings.

This keeps TuwaiqX local-first while allowing organizations to choose Ollama, an API endpoint, or downloaded model files managed on their own server.
