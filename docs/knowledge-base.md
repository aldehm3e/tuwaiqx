# Knowledge Base

Supported sources:

- PDF
- DOCX
- TXT and Markdown
- HTML
- CSV and XLSX
- JSON
- Manual text entries
- FAQ entries
- Website URL crawling

Document states:

- `uploaded`
- `parsing`
- `parsed`
- `indexing`
- `indexed`
- `failed`
- `archived`

Admins can assign knowledge to one bot or all bots, approve content, inspect errors, preview chunks, and re-index documents.

Use the Knowledge page actions to re-index one document or all documents. Re-indexing is required after changing the embedding provider or embedding model.

## PDF Text Quality

TuwaiqX extracts readable text from PDFs before chunking and indexing. Arabic and other RTL PDFs can sometimes be encoded by the PDF in visual order instead of reading order, so TuwaiqX applies conservative cleanup for common reversed Arabic lines, reversed words, and PDF font fragments before indexing.

Always inspect the document chunks after uploading important PDFs. If a PDF is scanned, image-only, or uses a very unusual embedded font, run OCR first or upload a cleaner text/OCR version. Re-index documents after parser, OCR, or source-file changes so stored chunks are rebuilt from the latest text.

## Manual Text vs FAQ

Manual text is for longer reference content such as policies, guides, schedules, or procedures. The bot searches the indexed text and answers from the matching chunks.

FAQ entries are for common direct questions. TuwaiqX stores the question separately and can return the stored answer for exact question matches before falling back to retrieval.

## Knowledge Gaps

Knowledge gaps are questions the bot could not answer from approved knowledge. They are stored so admins can see what content is missing and add or re-index knowledge later.
