// src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://admin:secret@mongo:27017/orders_db?authSource=admin";

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `📦 [MongoDB] Connected successfully: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ [MongoDB] Connection error:", error.message);
    // Cho phép service không crash ngay lập tức nếu đang trong quá trình docker khởi động
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
