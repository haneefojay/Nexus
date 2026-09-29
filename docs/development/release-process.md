# Release Process

A release candidate is cut only after the phase DoD. Freeze scope; reconcile requirements/ADRs; update changelog/version; run full CI, migration rehearsal, dependency/security scans, accessibility and critical E2E; build immutable artifacts; back up and verify restore readiness.

Deploy staging, migrate, smoke and observe. Production uses approval, backward-compatible migration order, health/readiness gates, and rollback/roll-forward notes. Record artifact digests, migration IDs, approver, time, and verification. Publish release notes with known limitations and truthful product claims. Failed gates stop the release.
