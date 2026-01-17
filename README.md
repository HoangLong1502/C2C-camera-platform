# C2C Camera Platform 📷

Nền tảng thương mại điện tử **C2C mua bán máy ảnh**, cho phép người dùng đăng bán, mua hàng và trò chuyện trực tiếp giữa người mua – người bán.

Project được xây dựng theo kiến trúc **Fullstack hiện đại**, sử dụng **Next.js** cho Frontend và **NestJS** cho Backend, áp dụng các tiêu chuẩn bảo mật và tổ chức code theo best practices.

---

## 🏗️ Architecture Overview

### Backend (NestJS)

* Framework: NestJS + TypeScript
* Database: PostgreSQL (TypeORM)
* Authentication: JWT (Access Token + Refresh Token)
* Password Hashing: bcrypt
* API Base URL: `http://localhost:3002/api`
* Port: 3002

### Frontend (Next.js)

* Framework: Next.js 16 (App Router)
* Styling: Tailwind CSS v4
* State Management: React Context (Auth)
* HTTP Client: Axios (interceptors + token refresh)
* Port: 3000

---

## ✨ Main Features

### User Features

* Đăng ký / đăng nhập người dùng (Email/Password và Google OAuth)
* Phân quyền: Buyer / Seller / Both / Admin
* Đăng bán sản phẩm máy ảnh với hình ảnh (base64)
* Tìm kiếm và lọc sản phẩm theo danh mục (Máy ảnh, Ống kính, Phụ kiện)
* Xem chi tiết sản phẩm
* Quản lý sản phẩm của mình

### Seller Features

* Quản lý sản phẩm cá nhân (CRUD)
* Đăng sản phẩm với:
  - Chọn loại sản phẩm (Máy ảnh, Ống kính, Khác)
  - Chọn độ mới (Đã qua sử dụng, Mới, Như mới, Cũ, Nát)
  - Upload nhiều hình ảnh
  - Thông tin đầy đủ (tên, mô tả, giá, số lượng, địa điểm)

### Admin Features

* Duyệt bài đăng sản phẩm
* Quản lý người dùng
* Theo dõi doanh thu theo ngày

---

## 🔐 Security Features

* Bcrypt password hashing (10 salt rounds)
* JWT Access Token (15 phút)
* JWT Refresh Token (7 ngày)
* Role-based access control (Guards)
* Input validation (class-validator)
* Rate limiting
* CORS configuration

---

## 🗂️ Project Structure

```
my_web/
├── backend/               # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Auth + JWT + Google OAuth
│   │   ├── products/      # Products CRUD
│   │   ├── entities/      # TypeORM Entities
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── swagger.yaml       # Swagger API document
│   ├── .env
│   └── package.json
│
├── frontend/              # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── page.tsx   # Homepage với navigation menu
│   │   │   ├── products/  # Product pages
│   │   │   ├── auth/      # Login/Register
│   │   │   ├── admin/     # Admin dashboard
│   │   │   └── my-products/ # Seller products
│   │   ├── contexts/      # Auth Context
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Axios client
│   └── package.json
│
├── database/              # Database config & queries
├── docker-compose.yml
└── README.md
```

---

## 🚀 Hướng Dẫn Chạy Project

### 1. Yêu cầu môi trường

Đảm bảo máy đã cài đặt:

* Node.js v18+
* npm
* Docker & Docker Compose
* PostgreSQL (hoặc dùng Docker)

Kiểm tra nhanh:

```bash
node -v
docker -v
docker-compose -v
```

---

### 2. Khởi chạy Database (PostgreSQL)

Tại thư mục gốc project:

```bash
docker-compose up -d postgres
```

Hoặc sử dụng PostgreSQL đã cài đặt sẵn.

**Cấu hình database:**
* Port: `5432` (hoặc `5440` nếu dùng Docker)
* Database: `c2c_platform` (hoặc `camera_web`)
* Tables được tạo tự động bằng TypeORM

**Setup database:**
```bash
cd backend
node setup-database.js
node check-categories.js
node update-condition-enum.js
```

---

### 3. Cài đặt & Chạy Backend (Port 3002)

Mở terminal mới:

```bash
cd backend
npm install

# Tạo file .env từ env.example
cp env.example .env
# Chỉnh sửa .env với thông tin database của bạn

npm run start:dev
```

Sau khi chạy thành công:

* API: `http://localhost:3002/api`
* Swagger UI (nếu bật): `http://localhost:3002/api/docs`
* Swagger file: `backend/swagger.yaml`

---

### 4. Cài đặt & Chạy Frontend (Port 3000)

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

* Web: `http://localhost:3000`

---

## 🔑 Tài Khoản Demo

* Không có tài khoản mặc định
* Người dùng tự đăng ký tại: `/auth/register`
* Hoặc đăng nhập bằng Google OAuth

**Gợi ý Role khi đăng ký:**
* **Buyer**: Chỉ mua hàng
* **Seller**: Chỉ bán hàng
* **Both**: Vừa mua vừa bán
* **Admin**: Quản trị hệ thống (cần set trong database)

---

## 📋 Tính Năng Chi Tiết

### Đăng Sản Phẩm

1. **Loại sản phẩm** (bắt buộc):
   - Máy ảnh
   - Ống kính
   - Khác (đèn, trigger, ...)

2. **Thông tin sản phẩm**:
   - Tên sản phẩm
   - Mô tả
   - Giá
   - Số lượng

3. **Độ mới** (bắt buộc):
   - Đã qua sử dụng
   - Mới
   - Như mới
   - Cũ
   - Nát

4. **Địa điểm** (bắt buộc)

5. **Hình ảnh**: Upload nhiều hình ảnh (tự động nén)

### Navigation Menu

Trang chủ có menu navigation với các danh mục:
- **Tất cả**: Hiển thị tất cả sản phẩm
- **Máy ảnh**: Lọc sản phẩm máy ảnh
- **Ống kính**: Lọc sản phẩm ống kính
- **Phụ kiện**: Lọc sản phẩm phụ kiện (bao gồm "Khác")

---

## 🧪 Testing Guide

### API Test (cURL)

**Register:**

```bash
curl -X POST http://localhost:3002/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "123456",
  "fullName": "Test User",
  "role": "both"
}'
```

**Login:**

```bash
curl -X POST http://localhost:3002/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "123456"
}'
```

**Create Product (cần token):**

```bash
curl -X POST http://localhost:3002/api/products \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-d '{
  "name": "Canon EOS R5",
  "description": "Full-frame mirrorless camera",
  "price": 4599,
  "condition": "new",
  "stock": 1,
  "location": "Hà Nội, Việt Nam",
  "categoryId": 1,
  "images": ["data:image/jpeg;base64,..."]
}'
```

---

## 📊 Database Schema

### Categories

* ID: 1 - Máy ảnh (camera)
* ID: 2 - Ống kính (lens)
* ID: 3 - Phụ kiện (accessory)

### Product Condition Enum

* `used` - Đã qua sử dụng
* `new` - Mới
* `like_new` - Như mới
* `old` - Cũ
* `damaged` - Nát

### Quan hệ chính:

* User → Product (One-to-Many)
* User → Order (One-to-Many)
* Product → Category (Many-to-One)
* Order → OrderItem (One-to-Many)
* Order → Transaction (One-to-One)
* ChatRoom → ChatMessage (One-to-Many)

---

## 🔧 Configuration

### Backend Environment Variables

Tạo file `backend/.env` (hoặc copy từ `backend/env.example`):

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=c2c_platform

PORT=3002
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Tạo file `frontend/.env.local` (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

---

## ⚠️ Notes

* Chỉ dùng `synchronize: true` trong môi trường dev
* Production cần:
  * TypeORM migrations
  * Đổi JWT secrets
  * Logging & monitoring
  * Rate limiting
  * HTTPS

---

## 📌 Project Status

### ✅ Hoàn thành

* Backend: Auth + Products CRUD
* Frontend: Auth + Product listing + Create product
* Hỗ trợ hình ảnh sản phẩm (base64, jsonb)
* Giao diện tiếng Việt
* Navigation menu với categories
* Form đăng sản phẩm đầy đủ

### 🚧 Đang phát triển

* Chat real-time (WebSocket)
* Order management
* Payment integration
* Admin dashboard đầy đủ
* Review & Rating system

---

## 🛠️ Troubleshooting

### Database Issues

**Kiểm tra categories:**
```bash
cd backend
node check-categories.js
```

**Cập nhật enum condition:**
```bash
cd backend
node update-condition-enum.js
```

**Reset database:**
```bash
cd backend
node reset-database.js
```

### Port Conflicts

Backend mặc định chạy trên port 3002. Nếu bị conflict:
- Thay đổi `PORT` trong `backend/.env`
- Hoặc kill process: `taskkill /F /IM node.exe` (Windows)

---

## 📄 License

This project is for educational purposes only.

---

## 👥 Contributors

* HoangLong1502

---

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
