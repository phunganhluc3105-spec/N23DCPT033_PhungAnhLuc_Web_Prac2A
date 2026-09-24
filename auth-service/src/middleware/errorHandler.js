// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] [Auth Service] ERROR:`, err);

  // Prisma unique constraint violation (P2002)
  if (err.code === "P2002") {
    const target = err.meta?.target
      ? Array.isArray(err.meta.target)
        ? err.meta.target.join(", ")
        : err.meta.target
      : "Email";
    return res.status(409).json({
      success: false,
      message: `${target} đã tồn tại trong hệ thống`,
    });
  }

  // Prisma record not found (P2025)
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy bản ghi người dùng",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
