// src/routes/orderRoutes.js
const router = require("express").Router();
const {
  createOrder,
  getOrdersByCustomer,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");
const {
  createOrderValidation,
  updateStatusValidation,
} = require("../middleware/validate");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API quản lý đơn hàng (MongoDB & Mongoose)
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateOrderRequest"
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tạo đơn hàng thành công
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *       422:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/", createOrderValidation, createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lấy danh sách tất cả đơn hàng (Hỗ trợ phân trang và lọc trạng thái)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipping, delivered, cancelled]
 *         description: Lọc theo trạng thái đơn hàng
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedOrders"
 */
router.get("/", getAllOrders);

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo ID khách hàng
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khách hàng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipping, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của khách hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedOrders"
 */
router.get("/customer/:customerId", getOrdersByCustomer);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng theo ID
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId của đơn hàng
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get("/:id", getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateOrderStatusRequest"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái thành công
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       422:
 *         description: Trạng thái không hợp lệ
 */
router.put("/:id/status", updateStatusValidation, updateOrderStatus);
router.patch("/:id/status", updateStatusValidation, updateOrderStatus);
router.put("/:id", updateStatusValidation, updateOrderStatus);

module.exports = router;
