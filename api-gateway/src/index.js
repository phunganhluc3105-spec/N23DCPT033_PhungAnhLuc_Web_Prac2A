// src/index.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const authenticate = require("./middleware/auth");
require("dotenv").config();

const app = express();

// ─── Security & CORS Middleware ───────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting: 100 requests / 15 phút / IP ─
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
  },
});
app.use(limiter);

// ─── Gateway Root & Health check ──────────────
app.get("/", (req, res) => {
  res.json({
    name: "Microservices Shop API Gateway",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      auth: "/api/auth (Public: register, login, refresh)",
      products: "/api/products (Public catalog)",
      orders: "/api/orders (Protected: Requires Bearer JWT)",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    gateway: true,
    service: "api-gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Helper tạo proxy middleware an toàn tương thích đa phiên bản
const createSafeProxy = (targetUrl, serviceName) => {
  const errorHandler = (err, req, res) => {
    console.error(`[Gateway Proxy Error] ${serviceName}:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: `${serviceName} hiện không khả dụng`,
        error: err.message,
      });
    }
  };

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    on: {
      error: errorHandler,
    },
    onError: errorHandler,
  });
};

// ─── Microservices Endpoints URL ──────────────
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3001";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:3002";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3003";

// ─── Proxy Routes ─────────────────────────────

// 1. Route: /api/auth/* -> Auth Service (Port 3003 - Public)
app.use(
  "/api/auth",
  createSafeProxy(`${AUTH_SERVICE_URL}/api/auth`, "Auth Service")
);

// 2. Route: /api/products/* -> Product Service (Port 3001 - Public)
app.use(
  "/api/products",
  createSafeProxy(`${PRODUCT_SERVICE_URL}/api/products`, "Product Service")
);

// 3. Route: /api/orders/* -> Order Service (Port 3002 - Protected with JWT)
app.use(
  "/api/orders",
  authenticate,
  createSafeProxy(`${ORDER_SERVICE_URL}/api/orders`, "Order Service")
);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [API Gateway] running on port ${PORT}`);
  console.log(`➡️  Proxying /api/auth     -> ${AUTH_SERVICE_URL} [PUBLIC]`);
  console.log(`➡️  Proxying /api/products -> ${PRODUCT_SERVICE_URL} [PUBLIC]`);
  console.log(`➡️  Proxying /api/orders   -> ${ORDER_SERVICE_URL} [PROTECTED (JWT)]`);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("\nReceived kill signal, shutting down API Gateway...");
  server.close(() => {
    console.log("API Gateway closed successfully.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
