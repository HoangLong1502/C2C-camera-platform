

# Security Features

## 🔒 Bảo mật người dùng đã được triển khai:

### 1. **Database Security**
- ✅ Bảng `users` với các fields: id, email, password_hash, role
- ✅ Password được hash trước khi lưu
- ✅ Bảng `user_sessions` để quản lý session
- ✅ Indexes tối ưu cho truy vấn

### 2. **Authentication**
- ✅ Login API endpoint: `/api/auth/login`
- ✅ Password verification
- ✅ Token-based authentication
- ✅ Role-based access control (admin/user)

### 3. **Frontend Security**
- ✅ LocalStorage để lưu token
- ✅ Protected routes (admin dashboard)
- ✅ Session management
- ✅ Logout functionality

### 4. **Password Hashing**
- ⚠️ Development: Simple hash
- ⚠️ Production: Nên dùng bcrypt

## 📝 Cấu trúc bảng Users:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔑 Admin Credentials:

- **Email:** admin@admin.com
- **Password:** 123
- **Role:** admin

## ⚠️ Lưu ý bảo mật:

1. **Password Hashing:**
   - Hiện tại dùng hash đơn giản cho development
   - Production nên dùng bcrypt với salt

2. **Session Management:**
   - Token được lưu trong localStorage
   - Production nên dùng HTTP-only cookies

3. **HTTPS:**
   - Production cần SSL/TLS

4. **Rate Limiting:**
   - Thêm rate limiting cho login API

5. **CORS:**
   - Điều chỉnh CORS cho production
