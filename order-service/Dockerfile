# Multi-stage build for order-service
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Hỗ trợ cả trường hợp có hoặc chưa có package-lock.json từ host
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules từ stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY --from=builder /app/package*.json ./

EXPOSE 3002
CMD ["node", "src/index.js"]
