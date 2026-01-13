# Hướng dẫn cấu hình Google OAuth

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Điền thông tin:
   - **Name**: C2C Camera Platform (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (cho development)
     - `https://yourdomain.com` (cho production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (cho development)
     - `https://yourdomain.com` (cho production)
7. Click **Create**
8. Copy **Client ID** và **Client Secret**

## Bước 2: Cấu hình Backend

Thêm vào file `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Bước 3: Cấu hình Frontend

Thêm vào file `frontend/.env.local` (tạo file mới nếu chưa có):

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Lưu ý**: Frontend chỉ cần Client ID, không cần Client Secret (vì Client Secret không được expose ra client-side).

## Bước 4: Restart Services

1. Restart backend server
2. Restart frontend server

## Kiểm tra

1. Mở trang login hoặc register
2. Bạn sẽ thấy nút "Sign in with Google" hoặc "Sign up with Google"
3. Click vào nút đó và đăng nhập bằng Google account
4. Sau khi đăng nhập thành công, bạn sẽ được redirect về home page

## Lưu ý

- Google OAuth chỉ hoạt động khi có đúng Client ID và Client Secret
- Nếu không cấu hình, nút Google Sign In sẽ không hiển thị
- User đăng ký bằng Google sẽ không có password và chỉ có thể đăng nhập bằng Google
