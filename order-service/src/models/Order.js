// src/models/Order.js
const mongoose = require("mongoose");

// Sub-schema cho mỗi sản phẩm trong đơn hàng
const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true }, // ID từ Product Service
    productName: { type: String, required: true }, // Snapshot tên tại thời điểm mua
    price: { type: Number, required: true }, // Giá tại thời điểm mua
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true, index: true }, // Tự sinh: ORD-YYYYMMDD-0001
    customerId: { type: Number, required: true }, // ID từ Auth Service
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
    },
    note: { type: String, default: "" },
  },
  {
    timestamps: true, // Tự động thêm createdAt & updatedAt
    versionKey: false, // Bỏ __v field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware: tự động sinh orderCode trước khi lưu
OrderSchema.pre("save", async function (next) {
  try {
    if (!this.orderCode) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await mongoose.model("Order").countDocuments();
      this.orderCode = `ORD-${date}-${String(count + 1).padStart(4, "0")}`;
    }
    if (typeof next === "function") next();
  } catch (error) {
    if (typeof next === "function") next(error);
    else throw error;
  }
});

// Virtual: tính tổng số lượng items
OrderSchema.virtual("totalItems").get(function () {
  return this.items ? this.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
});

// Indexes tối ưu hiệu năng truy vấn
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", OrderSchema);
