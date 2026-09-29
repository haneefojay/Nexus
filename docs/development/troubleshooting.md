# Troubleshooting

1. Verify Node/pnpm versions and run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env`; start `docker compose up -d --wait`; run `scripts/check-local-infrastructure.sh`.
3. Check `/health` for process and `/ready` for dependencies; inspect structured request/job IDs.
4. Confirm ports, container health, PostgreSQL extensions/migrations, Redis PONG, bucket service, and Mailpit UI/API.
5. Clear only generated `.next`, `.turbo`, and test caches; never delete volumes when diagnosing data/migration issues without a backup.
6. Reproduce with the smallest failing command and record environment, commit, logs (redacted), and expected/actual behavior.
