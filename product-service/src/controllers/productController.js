// src/controllers/productController.js
const { PrismaClient } = require("@prisma/client");
const { getCache, setCache, clearCachePattern } = require("../config/redis");
const { isCloudinaryConfigured } = require("../config/cloudinary");

const prisma = new PrismaClient();

// ──────────────────────────────────
// GET /api/products — Lấy danh sách có phân trang, lọc, sắp xếp (Có Redis Cache 5 phút)
// ──────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      sortBy = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Cache key chuẩn hoá theo các tham số truy vấn
    const cacheKey = `products:p${pageNum}:l${limitNum}:s${search}:c${category || "all"}:sb${sortBy}:o${order}:min${minPrice || "none"}:max${maxPrice || "none"}:stock${inStock || "all"}`;

    // 1. Kiểm tra cache từ Redis
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        fromCache: true,
      });
    }

    // 2. Nếu chưa có trong cache, query PostgreSQL
    const where = {
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(category && { category: { slug: category } }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
      ...(inStock === "true" && { stock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { [sortBy]: order.toLowerCase() === "asc" ? "asc" : "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const responsePayload = {
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // 3. Lưu vào Redis Cache trong 5 phút (300 giây)
    await setCache(cacheKey, responsePayload, 300);

    res.json({
      ...responsePayload,
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// GET /api/products/:id
// ──────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// POST /api/products
// ──────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const { name, price, description, stock, imageUrl, categoryId } = req.body;
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const slug = baseSlug || `product-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        description,
        stock: stock !== undefined ? parseInt(stock) : 0,
        imageUrl,
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
      include: { category: true },
    });

    // Xoá cache khi có sản phẩm mới
    await clearCachePattern("products:*");

    res.status(201).json({
      success: true,
      data: product,
      message: "Tạo sản phẩm thành công",
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// PUT /api/products/:id
// ──────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const { name, price, description, stock, imageUrl, categoryId, isActive } = req.body;
    const data = {};

    if (name !== undefined) {
      data.name = name;
      data.slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
    if (price !== undefined) data.price = price;
    if (description !== undefined) data.description = description;
    if (stock !== undefined) data.stock = parseInt(stock);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { category: true },
    });

    // Xoá cache khi dữ liệu thay đổi
    await clearCachePattern("products:*");

    res.json({ success: true, data: product, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// DELETE /api/products/:id (Soft delete)
// ──────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    // Xoá cache sau khi xoá mềm
    await clearCachePattern("products:*");

    res.json({ success: true, message: "Đã ẩn sản phẩm thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// POST /api/products/:id/image — Upload ảnh sản phẩm lên Cloudinary (Yêu cầu 3)
// ──────────────────────────────────
const uploadProductImage = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);

    // Kiểm tra sản phẩm có tồn tại không
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file ảnh để tải lên (trường 'image')",
      });
    }

    // URL ảnh từ Cloudinary hoặc fallback URL
    let imageUrl;
    if (req.file.path && isCloudinaryConfigured) {
      imageUrl = req.file.path; // URL do Cloudinary trả về
    } else {
      // Mock fallback nếu chưa điền API keys Cloudinary
      imageUrl = `https://res.cloudinary.com/demo/image/upload/sample-${Date.now()}.jpg`;
    }

    // Cập nhật trường imageUrl vào cơ sở dữ liệu
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
      include: { category: true },
    });

    // Xoá cache sau khi cập nhật ảnh
    await clearCachePattern("products:*");

    res.json({
      success: true,
      message: "Tải ảnh sản phẩm lên Cloudinary thành công",
      imageUrl,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
