# CameraStore - Trang Web Bán Máy ảnh & Phụ kiện

Ứng dụng web bán hàng máy ảnh và phụ kiện được xây dựng với React + Vite + PostgreSQL.

## 🌟 Tính năng

- ⚡ React 18 + Vite
- 🎨 Giao diện hiện đại với Tailwind CSS
- 🗄️ PostgreSQL Database
- 🐳 Docker Container
- 📱 Responsive Design
- 🛒 Giỏ hàng đầy đủ chức năng
- 💳 Thanh toán và đặt hàng
- 🔍 Tìm kiếm và lọc sản phẩm

## 🛠️ Cài đặt

### Yêu cầu
- Node.js (phiên bản 16 trở lên)
- Docker và Docker Compose
- npm hoặc yarn

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Khởi động Database

```bash
# Khởi động PostgreSQL trong Docker
npm run db:start

# Xem logs database
npm run db:logs

# Dừng database
npm run db:stop
```

### 3. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Chạy cả frontend và backend
npm run dev  # Frontend tại http://localhost:5176
node server.js  # Backend tại http://localhost:3001
```

## 📁 Cấu trúc Database

### Bảng Products
- id, name, description, price, category_id
- image_emoji, stock, is_active
- created_at, updated_at

### Bảng Categories
- id, name, slug, icon
- created_at, updated_at

### Bảng Orders
- id, customer_name, customer_phone, customer_email
- customer_address, total_price, status
- created_at, updated_at

### Bảng Order Items
- id, order_id, product_id, product_name
- product_price, quantity, subtotal
- created_at

## 🔌 Kết nối Database

**Thông tin kết nối:**
- Host: localhost
- Port: 5440
- Database: camera_web
- Username: postgres
- Password: 12343

Kết nối bằng DBeaver hoặc bất kỳ PostgreSQL client nào.

## 📝 API Endpoints

### Products
- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- Query params: `?category=&search=`

### Categories
- `GET /api/categories` - Lấy tất cả danh mục

### Orders
- `GET /api/orders` - Lấy tất cả đơn hàng
- `GET /api/orders/:id` - Lấy đơn hàng theo ID
- `POST /api/orders` - Tạo đơn hàng mới
- `PATCH /api/orders/:id/status` - Cập nhật trạng thái đơn hàng

## 🚀 Scripts

```bash
npm run dev              # Chạy development server
npm run build            # Build cho production
npm run preview          # Preview production build
npm run db:start         # Khởi động database
npm run db:stop          # Dừng database
npm run db:restart       # Khởi động lại database
npm run db:logs          # Xem logs database
```

## 📄 License

MIT

---

Happy coding! 🎉