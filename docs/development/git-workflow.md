# Git Workflow

`main` is releasable; active integration uses `dev`; work occurs on short-lived `feat/`, `fix/`, `docs/`, or `chore/` branches. Rebase/update before merge and use pull requests with requirement IDs, scope, screenshots for UI, migration/security notes, and validation evidence.

Commits are focused and use Conventional Commit intent (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`). Never commit secrets, generated caches, build outputs, or personal data. Do not force-push shared protected branches. Release tags are immutable and changelog-backed.
