FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter @nexus/worker...

FROM dependencies AS build
COPY apps/worker apps/worker
RUN pnpm --filter @nexus/worker build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
USER node
CMD ["node", "apps/worker/dist/main.js"]