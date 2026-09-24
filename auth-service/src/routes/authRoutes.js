// src/routes/authRoutes.js
const router = require("express").Router();
const {
  register,
  login,
  refresh,
  getMe,
} = require("../controllers/authController");
const {
  registerValidation,
  loginValidation,
  refreshValidation,
} = require("../middleware/validate");

// POST /api/auth/register — Đăng ký tài khoản
router.post("/register", registerValidation, register);

// POST /api/auth/login — Đăng nhập
router.post("/login", loginValidation, login);

// POST /api/auth/refresh — Cấp mới access token
router.post("/refresh", refreshValidation, refresh);

// GET /api/auth/me — Lấy thông tin user hiện tại
router.get("/me", getMe);

module.exports = router;
