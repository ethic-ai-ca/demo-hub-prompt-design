# Coolify / self-hosted production image (Next.js standalone)
# https://nextjs.org/docs/app/guides/self-hosting

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next expects a public dir; repo may not have one
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
# Optional: pass POSTGRES_URL at build time so `pnpm build` runs DB migrations
ARG POSTGRES_URL
ENV POSTGRES_URL=${POSTGRES_URL}
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
