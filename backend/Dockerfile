# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL deps (including devDeps so Prisma CLI is available for generate + db push)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN node node_modules/prisma/build/index.js generate

# Copy the rest of the source code
COPY . .

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Install openssl (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy built artifacts from builder (includes prisma CLI via devDeps)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Create a directory for the SQLite database and persist it via volume
RUN mkdir -p /app/data

# Prisma will write the DB here — override DATABASE_URL at runtime
ENV DATABASE_URL="file:/app/data/dev.db"
ENV PORT=3001

EXPOSE 3001

# Use direct node call to Prisma CLI (no npx download needed) then start server
CMD sh -c "node node_modules/prisma/build/index.js db push --accept-data-loss && node src/server.js"
