FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@11.20.0
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @devshare/api... --filter @devshare/shared

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY . .
RUN pnpm --filter @devshare/shared build
RUN pnpm --filter @devshare/api exec prisma generate
RUN pnpm --filter @devshare/api build
RUN pnpm --filter @devshare/api deploy --prod --legacy /app/prod

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/prod /app
# pnpm deploy 不会把私有 workspace 包 @devshare/shared 带入产物，这里显式拷贝
RUN rm -rf /app/node_modules/@devshare/shared
COPY --from=build /app/packages/shared/package.json /app/node_modules/@devshare/shared/package.json
COPY --from=build /app/packages/shared/dist /app/node_modules/@devshare/shared/dist
COPY --from=build /app/apps/api/prisma /app/prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
