// src/middleware/validate.js
const { body, param, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};

const createOrderValidation = [
  body("customerId")
    .notEmpty()
    .withMessage("customerId không được rỗng")
    .isInt({ min: 1 })
    .withMessage("customerId phải là số nguyên dương"),
  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("customerName không được rỗng")
    .isLength({ min: 2, max: 100 })
    .withMessage("customerName phải từ 2-100 ký tự"),
  body("customerEmail")
    .trim()
    .notEmpty()
    .withMessage("customerEmail không được rỗng")
    .isEmail()
    .withMessage("customerEmail không hợp lệ"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("items phải là mảng và có ít nhất 1 sản phẩm"),
  body("items.*.productId")
    .notEmpty()
    .withMessage("Mỗi item phải có productId")
    .isInt({ min: 1 })
    .withMessage("productId phải là số nguyên dương"),
  body("items.*.productName")
    .notEmpty()
    .withMessage("Mỗi item phải có productName"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Giá sản phẩm phải là số không âm"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Số lượng sản phẩm phải ≥ 1"),
  handleValidation,
];

const updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("status không được rỗng")
    .isIn(["pending", "confirmed", "shipping", "delivered", "cancelled"])
    .withMessage(
      "status phải là một trong các giá trị: pending, confirmed, shipping, delivered, cancelled"
    ),
  handleValidation,
];

module.exports = {
  createOrderValidation,
  updateStatusValidation,
  handleValidation,
};
