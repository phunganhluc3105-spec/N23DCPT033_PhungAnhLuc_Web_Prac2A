# Multi-stage build for auth-service
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
# Hỗ trợ cả trường hợp có hoặc chưa có package-lock.json từ host
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Prisma schema và generate client
COPY prisma ./prisma
RUN npx prisma generate

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

# Copy node_modules (đã bao gồm @prisma/client sinh ra từ stage 1)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src
COPY package.json ./

EXPOSE 3003
CMD ["node", "src/index.js"]
