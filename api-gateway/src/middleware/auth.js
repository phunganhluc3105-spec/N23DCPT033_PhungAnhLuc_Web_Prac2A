// src/middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * Middleware xác thực Bearer JWT token trong API Gateway
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập. Vui lòng cung cấp Bearer token trong header Authorization",
    });
  }

  try {
    const secret =
      process.env.JWT_SECRET ||
      "super_secret_jwt_key_at_least_32_characters_long_12345";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    // Chuyển tiếp context user xuống các microservices phía sau
    req.headers["x-user-id"] = String(decoded.id);
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

module.exports = authenticate;
