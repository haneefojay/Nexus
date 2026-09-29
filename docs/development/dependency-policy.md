# Dependency Policy

New dependencies require:

1. a concrete product or engineering purpose;
2. confirmation that the capability is not trivial to implement safely;
3. maintenance and release-activity review;
4. license compatibility;
5. bundle, runtime, and operational impact review;
6. known-vulnerability and supply-chain review;
7. architecture-boundary review;
8. lockfile update and automated validation.

## Installation controls

- pnpm is the only package manager for the monorepo.
- Exact versions are preferred for critical tooling and framework packages.
- Dependency lifecycle scripts are denied unless explicitly approved in `pnpm-workspace.yaml`.
- The lockfile is committed.
- CI runs `pnpm audit --audit-level high`.
- High and critical advisories block merging.
- Moderate advisories must be remediated or entered in the technical-debt register with owner, risk, and target phase.

Do not add libraries for trivial utilities or copy 21st.dev install commands without this review.
