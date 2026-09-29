FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @nexus/api...

FROM dependencies AS build
COPY apps/api apps/api
RUN pnpm --filter @nexus/api build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
USER node
CMD ["node", "apps/api/dist/main.js"]