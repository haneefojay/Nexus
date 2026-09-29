# API Errors

Errors use one envelope:

```json
{
  "error": {
    "code": "INSPECTION_INVALID_STATE",
    "message": "The inspection cannot be submitted from its current state.",
    "requestId": "...",
    "details": { "fields": [] }
  }
}
```

Codes are stable and machine-readable; messages are safe for users; details contain bounded field/conflict data. Never return stack traces, SQL/provider errors, secrets, raw object keys, or cross-tenant existence clues. Use 400 validation, 401 unauthenticated, 403 policy denial where safe, 404 scoped absence, 409 state/idempotency conflict, 413 size, 422 semantic validation, 429 rate limit, and 5xx unexpected/dependency failure.
