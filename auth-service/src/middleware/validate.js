// src/middleware/validate.js
const { body, validationResult } = require("express-validator");

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

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Họ và tên không được rỗng")
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ và tên từ 2 đến 100 ký tự"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được rỗng")
    .isEmail()
    .withMessage("Định dạng email không hợp lệ"),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu không được rỗng")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải chứa ít nhất 6 ký tự"),
  handleValidation,
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được rỗng")
    .isEmail()
    .withMessage("Định dạng email không hợp lệ"),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu không được rỗng"),
  handleValidation,
];

const refreshValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("refreshToken không được rỗng"),
  handleValidation,
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
  handleValidation,
};
