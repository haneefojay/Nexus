FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @nexus/web... build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "apps/web", "-H", "0.0.0.0", "-p", "3000"]
