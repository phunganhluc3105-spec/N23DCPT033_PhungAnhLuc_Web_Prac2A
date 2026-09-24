// src/swagger/swagger.js
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service API",
      version: "1.0.0",
      description: "API quản lý đơn hàng — MongoDB & Mongoose (Lab 2a Microservices)",
      contact: { name: "Dev Team", email: "dev@example.com" },
    },
    servers: [
      { url: "http://localhost:3002", description: "Development (Direct Service)" },
      { url: "http://localhost:3000", description: "Via API Gateway" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Nhập JWT Bearer token để xác thực các route yêu cầu đăng nhập",
        },
      },
      schemas: {
        OrderItem: {
          type: "object",
          required: ["productId", "productName", "price", "quantity"],
          properties: {
            productId: { type: "integer", example: 1 },
            productName: { type: "string", example: "iPhone 15 Pro" },
            price: { type: "number", example: 27990000 },
            quantity: { type: "integer", example: 2, minimum: 1 },
            subtotal: { type: "number", example: 55980000 },
          },
        },
        ShippingAddress: {
          type: "object",
          properties: {
            street: { type: "string", example: "123 Nguyễn Huệ" },
            city: { type: "string", example: "Hồ Chí Minh" },
            district: { type: "string", example: "Quận 1" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65f1c2d3e4b0a123456789ab" },
            orderCode: { type: "string", example: "ORD-20240924-0001" },
            customerId: { type: "integer", example: 101 },
            customerName: { type: "string", example: "Nguyen Van A" },
            customerEmail: { type: "string", example: "nguyenvana@gmail.com" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderItem" },
            },
            totalAmount: { type: "number", example: 55980000 },
            totalItems: { type: "integer", example: 2 },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
              example: "pending",
            },
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            note: { type: "string", example: "Giao hàng giờ hành chính" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: ["customerId", "customerName", "customerEmail", "items"],
          properties: {
            customerId: { type: "integer", example: 101 },
            customerName: { type: "string", example: "Nguyen Van A" },
            customerEmail: { type: "string", example: "nguyenvana@gmail.com" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "productName", "price", "quantity"],
                properties: {
                  productId: { type: "integer", example: 1 },
                  productName: { type: "string", example: "iPhone 15 Pro" },
                  price: { type: "number", example: 27990000 },
                  quantity: { type: "integer", example: 2 },
                },
              },
            },
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            note: { type: "string", example: "Giao hàng giờ hành chính" },
          },
        },
        UpdateOrderStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
              example: "confirmed",
            },
          },
        },
        PaginatedOrders: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Order" },
            },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer", example: 25 },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 3 },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Thông báo lỗi chi tiết" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "customerEmail" },
                  message: { type: "string", example: "Email không hợp lệ" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    "./src/routes/*.js",
  ],
};

module.exports = swaggerJsdoc(options);
