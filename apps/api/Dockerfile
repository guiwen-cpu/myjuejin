FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@11.20.0
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @devflow/api... --filter @devflow/shared

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY . .
RUN pnpm --filter @devflow/shared build
RUN pnpm --filter @devflow/api exec prisma generate
RUN pnpm --filter @devflow/api build
RUN pnpm --filter @devflow/api deploy --prod /app/prod

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/prod /app
COPY --from=build /app/apps/api/prisma /app/prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
