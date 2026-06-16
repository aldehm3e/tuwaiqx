-- The newer DocumentChunk_content_fts_idx matches the full-text fallback query.
-- Drop the older equivalent index to avoid duplicate write/storage overhead.
DROP INDEX IF EXISTS "DocumentChunk_content_tsv_idx";
