# 🔧 Cách Sửa Lỗi NULL ID trong DBeaver

## ❌ Lỗi:
```
ERROR: null value in column "id" violates not-null constraint
```

## ✅ Giải pháp:

### **Cách 1: Đừng chọn/điền cột ID khi edit**

Khi mở bảng `products` trong DBeaver để **EDIT**:

1. Click chuột phải vào bảng → **"Open Data"**
2. Trong Data Editor, **BỎ QUA** hoàn toàn cột `id`
3. Chỉ sửa các cột khác:
   - name
   - description  
   - price
   - category_id
   - image_emoji
   - stock
   - is_active
4. **KHÔNG TOUCH** cột `id`, `created_at`, `updated_at`
5. Click Save

### **Cách 2: Dùng SQL Query trực tiếp**

Thay vì dùng Data Editor, chạy SQL:

```sql
-- UPDATE sản phẩm
UPDATE products 
SET name = 'Tên mới',
    description = 'Mô tả mới',
    price = 50000000
WHERE id = 1;

-- INSERT sản phẩm mới (không có id)
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES ('Sản phẩm mới', 'Mô tả', 10000000, 2, '📷', 10);
```

### **Cách 3: Khóa cột ID trong DBeaver**

1. Mở Data Editor
2. Click chuột phải vào header cột `id`
3. Uncheck **"Editable"** - Cột này không thể edit được nữa
4. Giờ bạn chỉ có thể sửa các cột khác

## 🎯 Khuyến nghị:

**Nếu bạn cần thêm sản phẩm mới:**
```sql
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES (...);
```

**Nếu bạn cần sửa sản phẩm:**
```sql
UPDATE products SET name = '...', price = ... WHERE id = ...;
```

**Hoặc dùng Data Editor nhưng ĐỪNG chọn/di chuyển vào cột ID!**

## ⚠️ Lưu ý quan trọng:

- Cột `id` là **PRIMARY KEY** - Nó phải có giá trị
- Khi edit dòng hiện có, DBeaver có thể làm cho id = NULL
- **Giải pháp:** Không chọn/sửa cột ID
- Nếu vẫn lỗi, dùng SQL trực tiếp như trên

## ✅ Trigger đã được thêm:

Tôi đã thêm trigger vào database để tự động generate ID nếu NULL:
- Trigger: `prevent_null_products_id`
- Function: `prevent_null_id()`
- Nó sẽ tự động tạo ID nếu bị NULL

**Bây giờ bạn có thể edit thoải mái!**
