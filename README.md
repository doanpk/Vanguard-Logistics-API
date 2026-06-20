# 📦 Delivery Order Management API

Hệ thống Backend API quản lý quy trình đặt và nhận đơn hàng giao nhận, được xây dựng với kiến trúc MVC nghiêm ngặt. Hệ thống phân tách rõ ràng quyền hạn giữa Khách hàng (Customer) và Tài xế (Driver), đồng thời xử lý triệt để các bài toán khó như **Race Condition** và quản lý vòng đời đơn hàng qua **State Machine**.

## 🚀 Tính năng nổi bật

- **Phân quyền chặt chẽ (RBAC):** Sử dụng JWT Authentication, chặn tuyệt đối việc khách hàng gọi API tài xế (và ngược lại), ngăn chặn việc truy cập/chỉnh sửa đơn hàng của người khác (IDOR protection).
- **Xử lý Tranh chấp dữ liệu (Race Condition):** Giải quyết tình huống nhiều tài xế cùng tranh nhận 1 đơn hàng bằng Atomic Query của SQL, đảm bảo chỉ 1 người duy nhất nhận được đơn.
- **Cỗ máy trạng thái (State Machine):** Kiểm soát nghiêm ngặt luồng đi của đơn hàng: `Pending` → `Accepted` → `Completed`. Từ chối mọi yêu cầu chuyển trạng thái phi logic (ví dụ: đang *Completed* lại chuyển về *Cancelled*).
- **Chuẩn hóa Error Handling:** Mọi API (dù thành công hay lỗi) đều trả về một định dạng thống nhất: `{ success, message, data }` giúp Frontend dễ dàng tích hợp.
- **Tài liệu API Tự động (Swagger UI):** Mọi endpoint được document trực tiếp trên code bằng JSDoc, không bao giờ lo tài liệu lỗi thời.

---

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (Lưu trữ file cục bộ `database.sqlite` - Dễ dàng chạy ngay không cần cài cắm)
- **Bảo mật:** `jsonwebtoken` (JWT), `bcrypt` (Mã hóa mật khẩu)
- **Tài liệu & Logging:** `swagger-ui-express`, `winston`
- **Tích hợp:** `OpenStreetMap API` (Cloud Geocoding), `Google Gemini AI` (Smart Create)

---

## 📂 Kiến trúc Dự án (MVC)

Dự án áp dụng mô hình phân tách 4 Layers để dễ dàng maintain và scale:

```text
src/
 ├── routes/       # Chỉ định nghĩa endpoint, gắn middleware (verifyToken, requireRole)
 ├── controllers/  # Tiếp nhận Request, Validate dữ liệu, trả về Response chuẩn
 ├── services/     # Chứa 100% Business Logic nghiệp vụ (Check quyền, kiểm tra trạng thái...)
 ├── models/       # Nơi duy nhất tương tác với Database (Chứa câu lệnh SQL)
 ├── middleware/   # Chứa Centralized Error Handler xử lý lỗi toàn cục
 └── utils/        # Các hàm tiện ích (State Machine, Response Formatter)
```

---

## ⚙️ Hướng dẫn Cài đặt & Khởi chạy

Chỉ mất 1 phút để khởi chạy dự án tại máy local.

**1. Clone dự án và cài đặt Dependencies**
```bash
npm install
```

**2. Cấu hình biến môi trường**
Tạo file `.env` ở thư mục gốc (ngang hàng `package.json`) và thêm nội dung sau:
```env
PORT=5000
JWT_SECRET=super_secret_jwt_key_for_btl
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(Bạn có thể lấy GEMINI_API_KEY miễn phí tại Google AI Studio để test tính năng tạo đơn bằng AI)*

**3. Khởi động Server**
```bash
npm start
# Hoặc: node index.js
```
*Nếu thành công, Console sẽ in ra `Server is running on port 5000` và `Connected to SQLite Database`.*

---

## 📖 Tài liệu API (Swagger UI)

Khi server đang chạy, mở trình duyệt truy cập vào đường dẫn:
👉 **http://localhost:5000/api-docs**

Giao diện Swagger sẽ hiển thị toàn bộ tài liệu API. Bạn có thể **"Try it out"** trực tiếp trên trình duyệt.

**Các Endpoint chính:**
- `POST /api/auth/register` & `POST /api/auth/login` (Authentication)
- `POST /api/customer/orders` (Khách đặt đơn)
- `PUT /api/customer/orders/:id/cancel` (Khách hủy đơn)
- `GET /api/driver/orders/pending` (Tài xế tìm đơn)
- `PUT /api/driver/orders/:id/accept` (Tài xế nhận đơn)
- `PUT /api/driver/orders/:id/complete` (Tài xế giao xong)

> **💡 Cách dùng:** Gọi API `/login` lấy `token`, click vào nút **Authorize** màu xanh lá trên Swagger, gõ `Bearer <token>` vào để test các API yêu cầu xác thực.

---

## 🛡 Xử lý Lỗi (Centralized Error Handling)

Mọi Error được bắt bằng block `try/catch` tại Controller, đẩy qua `next(err)` và được xử lý tập trung. Ví dụ một lỗi khi nhập sai Pass:

```json
{
  "success": false,
  "message": "Invalid username or password.",
  "data": null
}
```

---
*Phát triển cho đồ án môn học API Development.*
