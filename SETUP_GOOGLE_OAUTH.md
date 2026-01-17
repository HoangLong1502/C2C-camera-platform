# 🔐 Hướng Dẫn Setup Google OAuth - Chi Tiết

Hướng dẫn từng bước để setup Google OAuth cho ứng dụng C2C Camera Platform.

---

## 📋 Bước 1: Tạo Google OAuth Credentials

### 1.1. Truy cập Google Cloud Console

1. Mở trình duyệt và truy cập: **https://console.cloud.google.com/**
2. Đăng nhập bằng tài khoản Google của bạn

### 1.2. Tạo Project (nếu chưa có)

1. Click vào dropdown **Project** ở trên cùng (bên cạnh logo Google Cloud)
2. Click **New Project**
3. Điền thông tin:
   - **Project name**: `C2C Camera Platform` (hoặc tên bạn muốn)
   - **Organization**: Để trống hoặc chọn organization của bạn
4. Click **Create**
5. Đợi project được tạo (khoảng 10-30 giây)
6. Chọn project vừa tạo từ dropdown

### 1.3. Bật Google+ API

1. Vào **APIs & Services** > **Library** (hoặc truy cập: https://console.cloud.google.com/apis/library)
2. Tìm kiếm: **Google+ API** hoặc **Google Identity Services**
3. Click vào **Google Identity Services API**
4. Click **Enable** (nếu chưa bật)

### 1.4. Tạo OAuth 2.0 Client ID

1. Vào **APIs & Services** > **Credentials** (hoặc truy cập: https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** ở trên cùng
3. Chọn **OAuth client ID**

### 1.5. Cấu hình OAuth Consent Screen (lần đầu tiên)

Nếu đây là lần đầu tạo OAuth credentials, bạn sẽ cần cấu hình Consent Screen:

1. Chọn **User Type**:
   - **External** (cho ứng dụng công khai) - Khuyến nghị
   - **Internal** (chỉ cho tài khoản trong organization)
2. Click **Create**
3. Điền thông tin:
   - **App name**: `C2C Camera Platform`
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
4. Click **Save and Continue**
5. **Scopes**: Click **Save and Continue** (giữ mặc định)
6. **Test users**: Thêm email của bạn nếu cần, sau đó click **Save and Continue**
7. **Summary**: Click **Back to Dashboard**

### 1.6. Tạo OAuth Client ID

1. Quay lại **Credentials** page
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Chọn **Application type**: **Web application**
4. Điền thông tin:
   - **Name**: `C2C Camera Platform Web Client`
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000
     ```
5. Click **Create**
6. **QUAN TRỌNG**: Copy 2 thông tin này:
   - **Your Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Your Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Lưu ý**: 
- Client Secret chỉ hiển thị 1 lần, hãy copy ngay!
- Nếu quên, bạn sẽ phải tạo lại Client ID mới

---

## 📝 Bước 2: Cấu hình Backend

### 2.1. Mở file `.env` trong thư mục `backend`

```bash
cd backend
```

### 2.2. Thêm Google OAuth credentials

Mở file `backend/.env` và thêm (hoặc cập nhật) các dòng sau:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

**Ví dụ:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
```

### 2.3. Lưu file

---

## 🎨 Bước 3: Cấu hình Frontend

### 3.1. Tạo file `.env.local` trong thư mục `frontend`

```bash
cd frontend
```

Tạo file mới tên `.env.local` (không có extension)

### 3.2. Thêm Google Client ID

Thêm dòng sau vào file `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Ví dụ:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

⚠️ **Lưu ý**: 
- Frontend **CHỈ** cần Client ID, **KHÔNG** cần Client Secret
- Client Secret phải được giữ bí mật và chỉ dùng ở backend

### 3.3. Lưu file

---

## 🔄 Bước 4: Restart Services

### 4.1. Restart Backend

1. Dừng backend server (Ctrl+C trong terminal đang chạy backend)
2. Chạy lại:
   ```bash
   cd backend
   npm run start:dev
   ```

### 4.2. Restart Frontend

1. Dừng frontend server (Ctrl+C trong terminal đang chạy frontend)
2. Chạy lại:
   ```bash
   cd frontend
   npm run dev
   ```

⚠️ **Quan trọng**: Next.js cần restart để load biến môi trường mới từ `.env.local`

---

## ✅ Bước 5: Kiểm tra

### 5.1. Kiểm tra Backend

1. Mở terminal và chạy:
   ```bash
   curl http://localhost:3002/api/auth/google
   ```
   - Nếu thấy lỗi validation (thiếu token) → Backend đã nhận được config ✅
   - Nếu thấy lỗi "Google OAuth is not configured" → Kiểm tra lại file `.env` của backend

### 5.2. Kiểm tra Frontend

1. Mở trình duyệt: **http://localhost:3000**
2. Vào trang **Login** hoặc **Register**
3. Bạn sẽ thấy nút **"Đăng nhập bằng Google"** hoặc **"Đăng ký bằng Google"**
4. Nút này **KHÔNG** còn bị disabled và có thể click được

### 5.3. Test đăng nhập

1. Click vào nút Google OAuth
2. Chọn tài khoản Google của bạn
3. Cho phép ứng dụng truy cập
4. Bạn sẽ được redirect về trang chủ và đã đăng nhập thành công! 🎉

---

## 🐛 Troubleshooting

### Vấn đề 1: Nút Google vẫn disabled

**Nguyên nhân**: Frontend chưa load được `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

**Giải pháp**:
1. Kiểm tra file `frontend/.env.local` có tồn tại không
2. Kiểm tra giá trị `NEXT_PUBLIC_GOOGLE_CLIENT_ID` có đúng không
3. **Restart frontend server** (quan trọng!)
4. Xóa cache: Xóa thư mục `frontend/.next` và restart

### Vấn đề 2: Lỗi "Google OAuth is not configured" khi đăng nhập

**Nguyên nhân**: Backend chưa có Google credentials

**Giải pháp**:
1. Kiểm tra file `backend/.env` có `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` không
2. Kiểm tra giá trị có đúng không (không có khoảng trắng thừa)
3. **Restart backend server**

### Vấn đề 3: Lỗi "redirect_uri_mismatch"

**Nguyên nhân**: Redirect URI trong Google Console không khớp với URL của ứng dụng

**Giải pháp**:
1. Vào Google Cloud Console > Credentials
2. Click vào OAuth Client ID của bạn
3. Thêm vào **Authorized redirect URIs**:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/login`
   - `http://localhost:3000/auth/register`
4. Click **Save**
5. Đợi 1-2 phút để Google cập nhật
6. Thử lại

### Vấn đề 4: Lỗi "invalid_client"

**Nguyên nhân**: Client ID hoặc Client Secret không đúng

**Giải pháp**:
1. Kiểm tra lại Client ID và Client Secret trong Google Console
2. Copy lại và cập nhật vào file `.env` và `.env.local`
3. Restart cả backend và frontend

### Vấn đề 5: Nút Google không hiển thị

**Nguyên nhân**: Script Google không load được

**Giải pháp**:
1. Kiểm tra kết nối internet
2. Mở Developer Console (F12) và xem có lỗi gì không
3. Kiểm tra xem có bị chặn bởi ad blocker không
4. Thử dùng trình duyệt khác

---

## 📚 Tài liệu tham khảo

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🔒 Bảo mật

⚠️ **QUAN TRỌNG**:

1. **KHÔNG BAO GIỜ** commit file `.env` hoặc `.env.local` lên Git
2. File `.env.local` đã được thêm vào `.gitignore` tự động
3. Client Secret phải được giữ bí mật, chỉ dùng ở backend
4. Trong production, sử dụng environment variables của hosting platform (Vercel, Heroku, etc.)

---

## ✨ Hoàn thành!

Sau khi setup xong, bạn có thể:
- ✅ Đăng nhập bằng Google
- ✅ Đăng ký bằng Google
- ✅ Tự động tạo tài khoản khi đăng nhập lần đầu
- ✅ Tự động đăng nhập nếu đã có tài khoản

Chúc bạn thành công! 🎉
