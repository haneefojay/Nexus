# Development Skills

## Installed: UI/UX Pro Max

- Location: `.agents/skills/ui-ux-pro-max`
- Installation: `npx ui-ux-pro-max-cli init --ai universal`
- Purpose: searchable product, style, typography, accessibility, interaction, and stack guidance.
- Verification: the bundled search script successfully generated a NEXUS product design-system recommendation.

Use it for new product surfaces, design-system changes, interaction design, responsive work, accessibility review, and UI quality control.

Example:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "field inspection operations spatial dashboard" \
  --design-system -p "NEXUS Product"
```

Treat results as recommendations. The authoritative NEXUS specification, accepted ADRs, accessibility requirements, and operational usability take precedence.

## Approved supporting resources

- 21st.dev for component-pattern research, never blind copying.
- Playwright documentation for E2E and offline-browser testing.
- Official framework and infrastructure documentation for Next.js, NestJS, Drizzle, PostgreSQL/PostGIS, MapLibre, Better Auth, Serwist, Dexie, BullMQ, and OpenTelemetry.

Do not install large collections of overlapping skills. Add a project skill only when it materially improves implementation quality and document its use here.
