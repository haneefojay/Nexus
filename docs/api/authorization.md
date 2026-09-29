# API Authorization

Each protected request resolves session → active membership → organization context → resource in that organization → role/resource/state policy. Client-supplied organization IDs narrow a query but never grant access. Nested IDs must belong to the same tenant and parent.

Endpoint tests cover allowed roles, denied roles, stale/deactivated membership, another tenant's IDs, invalid transitions, file/report download, batch/import rows, and offline commands. Prefer scoped 404 when disclosure is risky. Audit actor/action/resource/outcome from server context.
