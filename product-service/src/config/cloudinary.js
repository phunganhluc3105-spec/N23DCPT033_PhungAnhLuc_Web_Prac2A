// src/config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Hỗ trợ cả CLOUDINARY_URL hoặc 3 biến rời
if (process.env.CLOUDINARY_URL) {
  // Cloudinary tự động đọc CLOUDINARY_URL từ process.env
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
    api_key: process.env.CLOUDINARY_API_KEY || "123456789",
    api_secret: process.env.CLOUDINARY_API_SECRET || "abcdefghijklmnopqrstuvwxyz",
  });
}

let storage;

// Kiểm tra xem đã có đủ credentials của Cloudinary chưa
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
   process.env.CLOUDINARY_API_KEY &&
   process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "microservices-shop/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    },
  });
} else {
  // Fallback tạm thời nếu chưa cấu hình Cloudinary: lưu bộ nhớ tạm memoryStorage
  storage = multer.memoryStorage();
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tối đa 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận các file định dạng ảnh (jpg, png, webp)!"), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured,
};
