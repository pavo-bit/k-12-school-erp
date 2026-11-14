FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY apps/pdf-worker/package.json ./apps/pdf-worker/
RUN corepack enable && pnpm install --frozen-lockfile --filter @school-erp/pdf-worker...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm --filter @school-erp/pdf-worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/pdf-worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
ENV PORT=3002
CMD ["node", "dist/server.js"]