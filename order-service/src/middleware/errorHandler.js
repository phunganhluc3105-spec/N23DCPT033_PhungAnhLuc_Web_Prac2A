// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] [Order Service] ERROR:`, err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors,
    });
  }

  // Mongoose CastError (Sai định dạng ObjectId hoặc kiểu dữ liệu)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Định dạng dữ liệu không hợp lệ cho trường: ${err.path}`,
    });
  }

  // Mongoose Duplicate Key Error (Unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "Dữ liệu";
    return res.status(409).json({
      success: false,
      message: `${field} đã tồn tại trong hệ thống`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
