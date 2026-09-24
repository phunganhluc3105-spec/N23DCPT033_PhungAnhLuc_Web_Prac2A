// src/swagger/swagger.js
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Service API",
      version: "1.0.0",
      description: "API quản lý sản phẩm — Lab 2 Nâng cao",
      contact: { name: "Dev Team", email: "dev@example.com" },
    },
    servers: [
      { url: "http://localhost:3001", description: "Development" },
      { url: "https://product-service.railway.app", description: "Production" },
    ],
    components: {
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "iPhone 15 Pro" },
            slug: { type: "string", example: "iphone-15-pro" },
            price: { type: "number", example: 27990000 },
            stock: { type: "integer", example: 50 },
            description: { type: "string", example: "Mô tả sản phẩm..." },
            imageUrl: { type: "string", example: "https://..." },
            isActive: { type: "boolean", example: true },
            category: { $ref: "#/components/schemas/Category" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Điện thoại" },
            slug: { type: "string", example: "mobile" },
          },
        },
        PaginatedProducts: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Thông báo lỗi" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "name" },
                  message: { type: "string", example: "Tên không hợp lệ" },
                },
              },
            },
          },
        },
      },
    },
  },
  // Tự động scan JSDoc comments từ các file route
  apis: [
    path.join(__dirname, "../routes/*.js"),
    "./src/routes/*.js",
  ],
};

module.exports = swaggerJsdoc(options);
