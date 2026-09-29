# File Security

Buckets are private. The server authorizes target intent before issuing a short-lived opaque upload URL and verifies object existence, byte size, detected content type, checksum, tenant/target, and uploader at finalization. Extension and client MIME are hints only. Risky formats are rejected or quarantined/scanned. Images are decoded/re-encoded where appropriate and metadata retention is explicit.

Downloads require current resource authorization and short-lived URLs with safe disposition/filename. CSV export neutralizes spreadsheet formulas. Imports enforce size/row/column limits and safe parsing. Orphan, quarantined, and retained files have auditable lifecycle policies.
