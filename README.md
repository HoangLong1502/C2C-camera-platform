# C2C Camera Platform

Project E-Commerce mua bán máy ảnh (C2C) sử dụng **Next.js** (Frontend) và **NestJS** (Backend).

## 🚀 Hướng Dẫn Chạy Project

### 1. Yêu cầu
- Node.js (v18+)
- Docker & Docker Compose (để chạy database PostgreSQL)

### 2. Khởi chạy Database
Chạy container PostgreSQL:
```bash
docker-compose up -d postgres
```

### 3. Cài đặt & Chạy Backend (Cổng 3000)
Mở một terminal mới:
```bash
cd backend
npm install
npm run start:dev
```
- API chạy tại: `http://localhost:3000/api`
- Swagger Docs (File): `backend/swagger.yaml`

### 4. Cài đặt & Chạy Frontend (Cổng 3001)
Mở một terminal mới khác:
```bash
cd frontend
npm install
npm run dev
```
- Web chạy tại: `http://localhost:3001` (hoặc 3000 nếu backend chưa chạy, nhưng thường Next.js sẽ tự đổi port nếu bận)

## 🔑 Tài Khoản Demo

**Admin/User:**
Bạn có thể tự đăng ký tài khoản mới tại trang Register (`/auth/register`).
- Chọn Role "Sell products" hoặc "Buy and Sell" để có quyền đăng bán.

## 📂 Cấu Trúc
- `backend/`: Mã nguồn NestJS
- `frontend/`: Mã nguồn Next.js (App Router)
- `database/`: Các script SQL cũ (đã chuyển sang TypeORM entities)
