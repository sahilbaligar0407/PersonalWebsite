# Personal website (Next.js 14 App Router) — single Railway service.
# Multi-stage build using Next's standalone output to keep the runtime image small.

# --- deps: install node_modules from lockfile ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: compile the Next.js app ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner: minimal image that serves the standalone server ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Bind to all interfaces so Railway's healthcheck can reach the server.
ENV HOSTNAME=0.0.0.0
# Railway injects PORT; default for local `docker run`.
ENV PORT=8080

# Standalone output contains a trimmed node_modules + server.js.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
CMD ["node", "server.js"]
