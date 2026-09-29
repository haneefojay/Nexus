# Indexing

Every index maps to a measured query or constraint. Baseline patterns: scoped unique `(organization_id, normalized_identifier)`; tenant + lifecycle/status; due/attention partial indexes; GIST geometry; GIN/trigram only for bounded tenant search; stable cursor sort plus ID.

Before adding an index, capture representative `EXPLAIN (ANALYZE, BUFFERS)` in a safe environment. Track write/storage cost and remove redundant prefixes. Query regression tests assert bounded plans/latency rather than brittle exact planner output.
