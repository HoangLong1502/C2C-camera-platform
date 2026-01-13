# 🚀 QUICK START GUIDE

## Cách nhanh nhất

**Double-click:** `FINAL.bat`

Script này sẽ tự động:
1. ✅ Kiểm tra Docker
2. ✅ Khởi động database
3. ✅ Fix database issues
4. ✅ Cài đặt dependencies (nếu cần)
5. ✅ Khởi động Backend (port 3001)
6. ✅ Khởi động Frontend (port 3000)

## Sau khi chạy FINAL.bat

Đợi **15-20 giây**, sau đó:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## Tài khoản mặc định

- **Email**: admin@admin.com
- **Password**: 123

## Kiểm tra health

```bash
node check-health.js
```

## Troubleshooting

### Database lỗi?
```bash
# Cách 1: Dùng script
setup-database.bat

# Cách 2: Dùng npm
npm run setup

# Cách 3: Thủ công
cd backend
node setup-database.js
```

### Port bị chiếm?
```bash
# Kill processes
taskkill /F /IM node.exe
```

### Docker không chạy?
- Mở Docker Desktop
- Chạy lại `FINAL.bat`

## Manual Start

Nếu `FINAL.bat` không hoạt động:

```bash
# Terminal 1 - Database
docker-compose up -d

# Terminal 2 - Backend
cd backend
npm install
node setup-database.js
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```
