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

## Manual Text vs FAQ

Manual text is for longer reference content such as policies, guides, schedules, or procedures. The bot searches the indexed text and answers from the matching chunks.

FAQ entries are for common direct questions. TuwaiqX stores the question separately and can return the stored answer for exact question matches before falling back to retrieval.

## Knowledge Gaps

Knowledge gaps are questions the bot could not answer from approved knowledge. They are stored so admins can see what content is missing and add or re-index knowledge later.
