# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Install openssl (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy built artifacts from builder
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

# Run migrations and start the server
CMD sh -c "npx prisma migrate deploy && node src/server.js"
