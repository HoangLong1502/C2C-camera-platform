# Hướng dẫn thêm sản phẩm trong DBeaver

## ❌ Lỗi hiện tại:
Khi cố gắng insert vào bảng `products`, bạn nhận được lỗi:
```
null value in column "id" violates not-null constraint
```

## ✅ Giải pháp:

### **KHÔNG CHÈN CỘT `id` KHI THÊM SẢN PHẨM MỚI**

Cột `id` là `SERIAL PRIMARY KEY` - nó tự động tăng! Không cần phải nhập giá trị cho nó.

### Cách thêm sản phẩm mới:

#### **Option 1: Dùng SQL Query**

```sql
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES ('Tên sản phẩm', 'Mô tả sản phẩm', 10000000, 1, '📷', 10);
```

**CHÚ Ý:** KHÔNG bao gồm cột `id`, `created_at`, `updated_at` - chúng tự động!

#### **Option 2: Dùng Data Editor trong DBeaver**

1. Click chuột phải vào bảng `products`
2. Chọn **"Open Data"**
3. Click nút **"Insert New Row"** (dấu +)
4. **BỎ QUA** cột `id` (không điền gì vào)
5. Điền các thông tin khác:
   - `name`: Tên sản phẩm
   - `description`: Mô tả
   - `price`: Giá
   - `category_id`: ID của category (1=all, 2=camera, 3=lens, 4=accessory)
   - `image_emoji`: Emoji
   - `stock`: Số lượng
   - `is_active`: true
6. Click **"Save"**

## 📋 Các category_id hợp lệ:

```sql
SELECT * FROM categories;
```

Thường là:
- `1` - Tất cả
- `2` - Máy ảnh (camera)
- `3` - Ống kính (lens)
- `4` - Phụ kiện (accessory)

## 🎯 Ví dụ thêm sản phẩm mới:

```sql
-- Thêm máy ảnh mới
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES (
    'Panasonic Lumix G9',
    'Mirrorless camera 20.3MP',
    25000000,
    2,
    '📷',
    8
);

-- Thêm ống kính mới
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES (
    'Sony FE 24-70mm f/2.8',
    'Zoom lens chuyên nghiệp',
    45000000,
    3,
    '🔭',
    5
);
```

## ⚠️ Lưu ý quan trọng:

1. **KHÔNG nhập id** - để trống hoặc không chọn cột `id`
2. **category_id** phải tồn tại trong bảng `categories`
3. **price** là số, không có dấu phân cách
4. Database đã được fix sequence - ID tiếp theo sẽ là 13
