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
* API Base URL: `http://localhost:3000/api`
* Port: 3000

### Frontend (Next.js)

* Framework: Next.js 16 (App Router)
* Styling: Tailwind CSS v4
* State Management: React Context (Auth)
* HTTP Client: Axios (interceptors + token refresh)
* Port: 3001 (tự động tăng nếu bận)

---

## ✨ Main Features

### User Features

* Đăng ký / đăng nhập người dùng
* Phân quyền: Buyer / Seller / Both / Admin
* Đăng bán sản phẩm máy ảnh
* Tìm kiếm và xem chi tiết sản phẩm
* Chat trực tiếp giữa người mua và người bán

### Seller Features

* Quản lý sản phẩm cá nhân
* Theo dõi đơn hàng bán ra

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
│   │   ├── auth/          # Auth + JWT
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
│   │   ├── contexts/      # Auth Context
│   │   └── lib/           # Axios client
│   └── package.json
│
├── database/              # SQL legacy (đã migrate)
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

* Port: `5440`
* Database: `camera_web`
* Tables được tạo tự động bằng TypeORM

---

### 3. Cài đặt & Chạy Backend (Port 3000)

Mở terminal mới:

```bash
cd backend
npm install
npm run start:dev
```

Sau khi chạy thành công:

* API: `http://localhost:3000/api`
* Swagger UI (nếu bật): `http://localhost:3000/api/docs`
* Swagger file: `backend/swagger.yaml`

---

### 4. Cài đặt & Chạy Frontend (Port 3001)

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

* Web: `http://localhost:3001`

---

## 🔑 Tài Khoản Demo

* Không có tài khoản mặc định
* Người dùng tự đăng ký tại:

```
/auth/register
```

Gợi ý Role:

* Sell products
* Buy and Sell

Admin có thể set trực tiếp trong database.

---

## 🧪 Testing Guide

### API Test (cURL)

**Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
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
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "123456"
}'
```

---

## 📊 Database Schema

* TypeORM synchronize: true (dev only)
* Quan hệ chính:

  * User → Product
  * User → Order
  * Order → OrderItem
  * Order → Transaction
  * ChatRoom → ChatMessage

---

## ⚠️ Notes

* Chỉ dùng synchronize trong môi trường dev
* Production cần:

  * TypeORM migrations
  * Đổi JWT secrets
  * Logging & monitoring

---

## 📌 Project Status

* Backend: Hoàn thành Auth + Products
* Frontend: Auth + Product listing
* Chat, Orders, Admin: đang phát triển

---

## 📄 License

This project is for educational purposes only.
