// src/controllers/orderController.js
const Order = require("../models/Order");

// ──────────────────────────────────────────
// POST /api/orders — Tạo đơn hàng mới
// ──────────────────────────────────────────
const createOrder = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      shippingAddress,
      note,
    } = req.body;

    // Tính subtotal từng item và tổng tiền totalAmount
    const processedItems = items.map((item) => {
      const price = Number(item.price);
      const quantity = parseInt(item.quantity) || 1;
      return {
        productId: Number(item.productId),
        productName: item.productName,
        price,
        quantity,
        subtotal: price * quantity,
      };
    });

    const totalAmount = processedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const order = await Order.create({
      customerId: Number(customerId),
      customerName,
      customerEmail,
      items: processedItems,
      totalAmount,
      shippingAddress: shippingAddress || {},
      note: note || "",
    });

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// GET /api/orders/customer/:customerId — Lấy danh sách đơn theo khách hàng
// ──────────────────────────────────────────
const getOrdersByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { customerId: Number(customerId) };
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// GET /api/orders — Lấy tất cả đơn hàng (Admin/Tổng quan)
// ──────────────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// GET /api/orders/:id — Lấy chi tiết đơn hàng theo ID
// ──────────────────────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────
// PATCH/PUT /api/orders/:id/status — Cập nhật trạng thái đơn hàng
// ──────────────────────────────────────────
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrdersByCustomer,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
