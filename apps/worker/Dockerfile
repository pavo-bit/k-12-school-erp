FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY apps/worker/package.json ./apps/worker/
RUN corepack enable && pnpm install --frozen-lockfile --filter @school-erp/worker...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm --filter @school-erp/worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/server.js"]