# SmartCal — single Railway service (Vite build + Express API).
FROM node:20-alpine

WORKDIR /app

# Prisma's query engine needs OpenSSL on Alpine/musl.
RUN apk add --no-cache openssl

# Copy everything first so Prisma's generate can see prisma/schema.prisma and
# the SWC/esbuild platform binaries install correctly.
COPY . .

# Install deps, generate the Prisma client, and build the production SPA
# (base path /Calendar/).
RUN npm ci && npx prisma generate && npm run build

ENV NODE_ENV=production
# Serve the app under /Calendar so it lives at sahilbaligar.com/Calendar.
ENV APP_BASE_PATH=/Calendar
# Railway injects PORT; default for local docker runs.
ENV PORT=8080
EXPOSE 8080

# Boot via start.sh (migrate deploy + exec node server.js).
CMD ["sh", "start.sh"]
