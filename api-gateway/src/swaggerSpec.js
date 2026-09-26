// src/swaggerSpec.js

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Microservices Shop API Gateway Docs",
    version: "1.0.0",
    description:
      "Tài liệu tương tác OpenAPI 3.0 hợp nhất toàn bộ Microservices (Auth, Products, Orders qua API Gateway). Thầy cô có thể bấm 'Try it out' ➡️ 'Execute' để kiểm tra trực tiếp từng endpoint.",
    contact: {
      name: "Phùng Anh Lực - N23DCPT033",
      email: "phunganhluc@example.com",
    },
  },
  servers: [
    {
      url: "https://gateway-service-production-69d0.up.railway.app",
      description: "Live Railway Production Gateway",
    },
    {
      url: "http://localhost:3000",
      description: "Local Development Gateway",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập JWT Token nhận được từ API Đăng nhập (/api/auth/login)",
      },
    },
  },
  paths: {
    // ─── AUTH SERVICE ─────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth Service"],
        summary: "1. Đăng ký tài khoản người dùng mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Nguyen Van A" },
                  email: { type: "string", example: "nguyenvana@gmail.com" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng ký thành công, cấp phát token" },
          409: { description: "Email đã tồn tại" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth Service"],
        summary: "2. Đăng nhập lấy cặp Access Token & Refresh Token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "nguyenvana@gmail.com" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Đăng nhập thành công, trả về accessToken và refreshToken" },
          401: { description: "Sai thông tin đăng nhập" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth Service"],
        summary: "3. Cấp mới Access Token khi token cũ hết hạn (Req 1)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cấp mới Access Token thành công" },
          403: { description: "Refresh token không hợp lệ" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth Service"],
        summary: "4. Xem thông tin tài khoản hiện tại (Cần Bearer Token)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Thông tin profile user" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },

    // ─── PRODUCT SERVICE ──────────────────────
    "/api/products": {
      get: {
        tags: ["Product Service"],
        summary: "5. Danh sách sản phẩm (Phân trang, Lọc, Tích hợp Redis Cache)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Số trang" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Số mục / trang" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Tìm kiếm theo tên" },
          { name: "minPrice", in: "query", schema: { type: "number" }, description: "Giá thấp nhất" },
          { name: "maxPrice", in: "query", schema: { type: "number" }, description: "Giá cao nhất" },
        ],
        responses: {
          200: { description: "Trả về mảng sản phẩm. Chú ý trường fromCache: true/false thể hiện Redis Caching" },
        },
      },
      post: {
        tags: ["Product Service"],
        summary: "6. Tạo sản phẩm mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price"],
                properties: {
                  name: { type: "string", example: "Bàn phím cơ Custom" },
                  price: { type: "number", example: 1850000 },
                  stock: { type: "integer", example: 20 },
                  description: { type: "string", example: "Bàn phím cơ switch êm ái" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo sản phẩm thành công" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Product Service"],
        summary: "7. Xem chi tiết sản phẩm theo ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Chi tiết sản phẩm" },
          404: { description: "Không tìm thấy" },
        },
      },
      put: {
        tags: ["Product Service"],
        summary: "8. Cập nhật thông tin / giá sản phẩm",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  price: { type: "number", example: 1750000 },
                  stock: { type: "integer", example: 35 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công, Redis cache tự động được làm mới" },
        },
      },
      delete: {
        tags: ["Product Service"],
        summary: "9. Xoá mềm sản phẩm (Soft Delete)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Xoá mềm thành công (is_active = false)" },
        },
      },
    },
    "/api/products/{id}/image": {
      post: {
        tags: ["Product Service"],
        summary: "10. Tải ảnh sản phẩm lên Cloudinary CDN (Req 3)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", format: "binary", description: "Tệp ảnh PNG/JPG/WEBP" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Tải lên Cloudinary thành công, cập nhật imageUrl" },
        },
      },
    },

    // ─── ORDER SERVICE (JWT PROTECTED) ─────────
    "/api/orders": {
      post: {
        tags: ["Order Service (JWT Protected)"],
        summary: "11. Tạo đơn đặt hàng mới (Yêu cầu Bearer Token)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["customerId", "customerName", "customerEmail", "items", "shippingAddress"],
                properties: {
                  customerId: { type: "integer", example: 1 },
                  customerName: { type: "string", example: "Nguyen Van A" },
                  customerEmail: { type: "string", example: "nguyenvana@gmail.com" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "integer", example: 9 },
                        productName: { type: "string", example: "iPhone 16 Pro Max 256GB" },
                        price: { type: "number", example: 34990000 },
                        quantity: { type: "integer", example: 1 },
                      },
                    },
                  },
                  shippingAddress: {
                    type: "object",
                    properties: {
                      street: { type: "string", example: "123 Nguyen Hue" },
                      district: { type: "string", example: "Quan 1" },
                      city: { type: "string", example: "Ho Chi Minh" },
                    },
                  },
                  note: { type: "string", example: "Giao gio hanh chinh" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo đơn thành công trên MongoDB Atlas, tự sinh orderCode: ORD-YYYYMMDD-XXXX và totalItems" },
          401: { description: "Chưa đăng nhập (Chặn bởi Gateway JWT Middleware)" },
        },
      },
      get: {
        tags: ["Order Service (JWT Protected)"],
        summary: "12. Danh sách đơn hàng (Yêu cầu Bearer Token)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Danh sách đơn hàng từ MongoDB Atlas" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Order Service (JWT Protected)"],
        summary: "13. Xem chi tiết đơn hàng theo MongoDB ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Chi tiết đơn hàng" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/api/orders/{id}/status": {
      put: {
        tags: ["Order Service (JWT Protected)"],
        summary: "14. Cập nhật trạng thái đơn hàng (Yêu cầu Bearer Token)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
                    example: "confirmed",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật trạng thái thành công" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
  },
};
