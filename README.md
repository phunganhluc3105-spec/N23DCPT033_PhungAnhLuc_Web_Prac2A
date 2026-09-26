# BÁO CÁO THỰC HÀNH LAB 2A: KIẾN TRÚC MICROSERVICES
## Môn học: Lập trình web

---

### 👨‍💻 THÔNG TIN SINH VIÊN
* **Họ và tên:** Phùng Anh Lực
* **Mã số sinh viên (MSSV):** N23DCPT033
* **Repository Backend:** [N23DCPT033_PhungAnhLuc_Web_Prac2A](https://github.com/phunganhluc3105-spec/N23DCPT033_PhungAnhLuc_Web_Prac2A)
* **Repository Frontend:** [N23DCPT033_PhungAnhLuc_Web_Prac2A-FE](https://github.com/phunganhluc3105-spec/N23DCPT033_PhungAnhLuc_Web_Prac2A-FE)

---

### 🌐 HỆ THỐNG LIÊN KẾT TRỰC TUYẾN (LIVE PRODUCTION)
* **API Gateway (Public Endpoint):** [https://gateway-service-production-69d0.up.railway.app](https://gateway-service-production-69d0.up.railway.app)
* **Health Check Gateway:** [https://gateway-service-production-69d0.up.railway.app/health](https://gateway-service-production-69d0.up.railway.app/health)
* **API Danh sách sản phẩm (Public):** [https://gateway-service-production-69d0.up.railway.app/api/products](https://gateway-service-production-69d0.up.railway.app/api/products)
* **Cloud Database:**
  * **PostgreSQL:** Supabase Pooler (`aws-0-ap-southeast-1.pooler.supabase.com`)
  * **MongoDB:** MongoDB Atlas Replica Set Cluster
  * **Media Storage:** Cloudinary CDN
* **Postman Collection Test Suite:** [`postman/Lab2.postman_collection.json`](./postman/Lab2.postman_collection.json)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được xây dựng theo kiến trúc **Microservices phân tán**, toàn bộ giao tiếp ngoại vi đi qua một đầu mối duy nhất là **API Gateway**. Mạng nội bộ kết nối an toàn bằng **Railway Private Network** (`*.railway.internal`).

```mermaid
graph TD
    Client["Client / Frontend / Postman"] -->|HTTPS Traffic| GW["API Gateway (Port 3000)"]
    
    subgraph "Railway Private Network"
        GW -->|Public Routes /api/auth| Auth["Auth Service (Port 3003)"]
        GW -->|Public Routes /api/products| Prod["Product Service (Port 3001)"]
        GW -->|JWT Protected /api/orders| Order["Order Service (Port 3002)"]
        
        Prod <-->|Cache Hit/Miss| Redis[("Redis Cache")]
    end
    
    subgraph "Cloud Managed Databases & Storage"
        Auth -->|Prisma ORM| SupaDB[("Supabase PostgreSQL")]
        Prod -->|Prisma ORM| SupaDB
        Prod -->|Multer SDK| Cloudinary[("Cloudinary CDN")]
        Order -->|Mongoose ODM| AtlasDB[("MongoDB Atlas")]
    end
```

### Chi tiết các thành phần:
1. **API Gateway (`api-gateway`):**
   * Reverse Proxy định tuyến traffic đến các service con.
   * Rate Limiter: giới hạn 100 requests / 15 phút / IP.
   * CORS & Helmet HTTP Security Headers.
   * Middleware xác thực JWT tập trung: chặn `401 Unauthorized` đối với các route đơn hàng `/api/orders`.
2. **Product Service (`product-service`):**
   * Quản lý sản phẩm & danh mục bằng **PostgreSQL + Prisma ORM**.
   * Đầy đủ nghiệp vụ: CRUD, phân trang, lọc nâng cao, soft delete (xoá mềm).
   * **Redis Cache:** Lưu cache danh sách sản phẩm với TTL 5 phút, tự động xoá cache khi có thay đổi dữ liệu.
   * **Cloudinary Upload:** Hỗ trợ upload ảnh sản phẩm trực tiếp lên Cloudinary CDN (`POST /api/products/:id/image`).
   * Tài liệu Swagger UI tại `/api-docs`.
3. **Order Service (`order-service`):**
   * Quản lý đơn đặt hàng bằng **MongoDB + Mongoose ODM**.
   * Pre-save hook tự động tạo mã đơn hàng dạng `ORD-YYYYMMDD-XXXX`.
   * Virtual field `totalItems` tự động tính tổng số lượng món hàng.
   * Tài liệu Swagger UI tại `/api-docs` có tích hợp nút **Authorize (Bearer Token)**.
4. **Auth Service (`auth-service`):**
   * Đăng ký, Đăng nhập, Cấp phát cặp JWT Token: `accessToken` (15 phút) và `refreshToken` (7 ngày).
   * Mã hoá mật khẩu bằng `bcryptjs` (salt 10 vòng).
   * Endpoint `GET /api/auth/me` xem thông tin tài khoản đang đăng nhập.
5. **Frontend Web Storefront (`lab2a-frontend`):**
   * Xây dựng bằng **Next.js 15 (App Router) + Tailwind CSS + shadcn/ui**.
   * Kết nối trực tiếp API Gateway, hiển thị huy hiệu `⚡ Redis Cache`, hỗ trợ giỏ hàng, đặt hàng và upload ảnh Cloudinary trực tiếp.

---

## 2. HÌNH ẢNH TỔNG QUAN
### 📸 ẢNH 1: Kiến trúc triển khai trên Railway Cloud
*Toàn bộ 4 microservices và Redis đều ở trạng thái Online trong cùng 1 mạng riêng tư.*

![Railway Architecture Canvas](./docs/images/01_railway_architecture.png)
*(Hình 1: Dashboard Railway hiển thị gateway-service, product-service, order-service, auth-service và Redis)*

---

### 📸 ẢNH 2: API Gateway Live Health Check
*API Gateway hoạt động trên tên miền công khai và điều phối các dịch vụ.*

![API Gateway Health Check](./docs/images/02_gateway_health.png)
*(Hình 2: Trình duyệt truy cập `https://gateway-service-production-69d0.up.railway.app/health` trả về status ok)*

---

### 📸 ẢNH 3: Auth Service (Đăng ký, Đăng nhập & JWT)
*Cấp phát accessToken (15 phút) và refreshToken (7 ngày) lưu an toàn.*

![Auth Register & Login](./docs/images/03_auth_tokens.png)
*(Hình 3: Postman gọi POST /api/auth/register và POST /api/auth/login trả về HTTP 201/200 kèm accessToken)*

---

### 📸 ẢNH 4: Gateway JWT Auth Guard
*Gateway chặn 401 Unauthorized khi truy cập /api/orders không có Token.*

![Gateway JWT Protection](./docs/images/04_jwt_guard_401.png)
*(Hình 4: Gọi GET /api/orders khi chưa có Bearer Token, Gateway trả về 401 Chưa đăng nhập)*

---

### 📸 ẢNH 5: Product Service — Phân trang, Tìm kiếm & Lọc
*Kết quả trả về danh sách sản phẩm với cấu trúc pagination.*

![Product Pagination & Filter](./docs/images/05_product_pagination.png)
*(Hình 5: GET /api/products?page=1&limit=5 lọc theo tên và minPrice)*

---

### 📸 ẢNH 6:Yêu cầu 4 Caching dữ liệu với Redis

![Redis Cache Verification](./docs/images/06_redis_caching.png)
*(Hình 6: Ở lần gọi thứ 2 "fromCache": true lấy từ RAM Redis)*

---

### 📸 ẢNH 7: Yêu cầu 3 Upload ảnh sản phẩm lên Cloudinary

![Cloudinary Upload](./docs/images/07_cloudinary_upload.png)
*(Hình 7: Gọi POST /api/products/:id/image kèm file ảnh, trả về HTTP 200 kèm link Cloudinary)*

---

### 📸 Minh chứng 8: Order Service — MongoDB Atlas & Tự sinh orderCode
*Đơn hàng được lưu vào MongoDB với mã `ORD-YYYYMMDD-XXXX` và trường ảo `totalItems`.*

![Order Creation](./docs/images/08_order_created.png)
*(Hình 8: POST /api/orders tạo đơn hàng thành công, hiển thị orderCode tự sinh và totalItems)*

---

### 📸 Minh chứng 9: Yêu cầu 5 — Swagger UI với Bearer Auth
*Giao diện tài liệu tương tác với nút Authorize Bearer Token.*

![Swagger UI Docs](./docs/images/09_swagger_bearer_auth.png)
*(Hình 9: Giao diện Swagger UI tại /api-docs hiển thị các endpoint và ô nhập Bearer JWT)*

---

### 📸 Minh chứng 10: Cơ sở dữ liệu Cloud thực tế
*Dữ liệu được lưu trữ trên Supabase (PostgreSQL) và MongoDB Atlas.*

| Supabase PostgreSQL (Table Editor) | MongoDB Atlas (Collection Viewer) |
| :---: | :---: |
| ![Supabase Table](./docs/images/10_supabase_tables.png) | ![MongoDB Atlas](./docs/images/10_mongodb_orders.png) |
| *(Bảng `products` & `users` trên Supabase)* | *(Collection `orders` trên MongoDB Atlas)* |

---

### 📸 Minh chứng 11: Postman Automated Test Suite
*Toàn bộ kịch bản kiểm thử tự động đều vượt qua (Pass).*

![Postman Test Runner 100% Pass](./docs/images/11_postman_pass_all.png)
*(Hình 11: Màn hình Postman Collection Runner hoàn thành 100% test cases)*

---

## 3. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### 🐳 Khởi chạy môi trường Local bằng Docker Compose
Chỉ cần 1 câu lệnh duy nhất để khởi động toàn bộ 7 containers (4 services + 3 databases/cache):

```bash
# 1. Clone repository
git clone https://github.com/phunganhluc3105-spec/N23DCPT033_PhungAnhLuc_Web_Prac2A.git
cd N23DCPT033_PhungAnhLuc_Web_Prac2A

# 2. Khởi động toàn bộ hệ thống
docker compose up -d --build

# 3. Chạy seed dữ liệu mẫu sản phẩm
docker compose exec product_service node prisma/seed.js
```

