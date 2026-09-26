// src/index.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const authenticate = require("./middleware/auth");
require("dotenv").config();

const swaggerSpec = require("./swaggerSpec");

const app = express();

// ─── Security & CORS Middleware ───────────────
// Tắt CSP mặc định để giao diện Swagger UI CDN tải CSS/JS mượt mà
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*")) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy does not allow access from this origin."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

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

// ─── Swagger UI Interactive Docs ──────────────
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.get("/api-docs", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Microservices API Gateway Docs — Lab 2a</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background: #fdfdfd; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 25px 0; }
    .swagger-ui .info .title { font-size: 28px; color: #1e1b4b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// ─── Gateway Root & Health check ──────────────
app.get("/", (req, res) => {
  res.json({
    name: "Microservices Shop API Gateway",
    version: "1.0.0",
    status: "online",
    documentation: "/api-docs",
    endpoints: {
      swagger: "/api-docs",
      health: "/health",
      auth: "/api/auth (Public: register, login, refresh)",
      products: "/api/products (Public catalog, Redis Cache)",
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
