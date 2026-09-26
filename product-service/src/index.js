// src/index.js
const app = require("./app");

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [Product Service] running on port ${PORT}`);
  console.log(`📚 Swagger Docs available at http://0.0.0.0:${PORT}/api-docs`);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("\nReceived kill signal, shutting down gracefully...");
  server.close(() => {
    console.log("Closed out remaining connections.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
