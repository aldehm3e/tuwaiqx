-- Use the simple configuration for broad multilingual tokenization.
-- Language-specific search configs can be added later per document language.
CREATE INDEX IF NOT EXISTS "DocumentChunk_content_fts_idx"
ON "DocumentChunk"
USING GIN (to_tsvector('simple', coalesce("content", '')));
