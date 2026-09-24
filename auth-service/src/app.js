// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

// ─── Security & Logging Middleware ───────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check Endpoint ───────────────────
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: process.env.SERVICE_NAME || "auth-service",
    uptime: process.uptime(),
  })
);

// ─── Auth Routes ─────────────────────────────
app.use("/api/auth", authRoutes);

// ─── Global Error Handler ────────────────────
app.use(errorHandler);

module.exports = app;
