// src/index.js
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3002;

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🛒 [Order Service] running on port ${PORT}`);
  console.log(`📚 Swagger Docs available at http://0.0.0.0:${PORT}/api-docs`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log("\nReceived kill signal, closing MongoDB connection & server...");
  try {
    await mongoose.connection.close();
    server.close(() => {
      console.log("Closed all remaining connections.");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
