# syntax=docker/dockerfile:1.7
#
# Builds the BlooCube Express/Prisma API for Cloud Run.
#
# IMPORTANT — database durability: this image ships with SQLite for a
# single-instance deployment (DATABASE_URL defaults to a file inside the
# container). That file does NOT persist across redeploys or container
# restarts, and will NOT work correctly with more than one instance
# (Cloud Run may run several concurrently). It's good enough to put a real,
# working backend online quickly. For real production durability, provision
# a managed Postgres database, set DATABASE_URL to it, and change
# `provider = "sqlite"` to `provider = "postgresql"` in prisma/schema.prisma
# (requires regenerating migrations against Postgres) before scaling past
# one instance. See backend/.env.example and the root README.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 express

COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/package.json ./package.json
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma

# SQLite lives here inside the container (ephemeral — see note above).
ENV DATABASE_URL="file:/app/data/prod.db"
RUN mkdir -p /app/data && chown express:nodejs /app/data

USER express

# Cloud Run injects PORT (defaults to 8080); the app reads it via process.env.PORT.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8080)+'/health', r=>{if(r.statusCode<200||r.statusCode>=500)process.exit(1)}).on('error',()=>process.exit(1))" || exit 1

# Apply migrations (creating/updating the SQLite file) then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
