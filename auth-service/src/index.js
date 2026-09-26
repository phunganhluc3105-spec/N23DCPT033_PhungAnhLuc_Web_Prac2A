// src/index.js
const app = require("./app");

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 [Auth Service] running on port ${PORT}`);
  console.log(`➡️  Endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, GET /api/auth/me`);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("\nReceived kill signal, shutting down Auth Service...");
  server.close(() => {
    console.log("Auth Service stopped gracefully.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
