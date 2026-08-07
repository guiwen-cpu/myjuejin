FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@11.20.0
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @devflow/web... --filter @devflow/shared

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @devflow/shared build
RUN pnpm --filter @devflow/web build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/web/.output /app/.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
