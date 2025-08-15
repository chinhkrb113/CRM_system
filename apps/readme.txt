# CRM System - Hướng dẫn chạy ứng dụng

## Các bước chạy chương trình

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Khởi động API Core (Port 3001)
```bash
cd apps/api-core
npm run dev
```

### Bước 3: Khởi động API Learning (Port 3002)
```bash
cd apps/api-learning
npm run dev
```

### Bước 4: Truy cập tài liệu API
- **API Core Swagger**: http://localhost:3001/api/docs
- **API Learning Swagger**: http://localhost:3002/api-docs

### Bước 5: Test hệ thống
- **Health Check**: GET http://localhost:3001/api/core/health
- **Login**: POST http://localhost:3001/api/core/auth/login

## Thông tin đăng nhập test
- **Email**: admin@crm.com
- **Password**: password123

## Phân quyền hệ thống

### ADMIN Role
- **Quyền**: Toàn quyền truy cập tất cả endpoints
- **API Core Endpoints**:
  - GET/POST/PUT/DELETE `/api/core/users/*` - Quản lý người dùng
  - GET/POST/PUT/DELETE `/api/core/roles/*` - Quản lý vai trò
  - GET/POST/PUT/DELETE `/api/core/permissions/*` - Quản lý quyền
  - GET `/api/core/auth/*` - Xác thực
  - GET `/api/core/health` - Kiểm tra sức khỏe
- **API Learning Endpoints**:
  - GET/POST/PUT/DELETE `/api/learn/students/*` - Quản lý học viên
  - GET/POST/PUT/DELETE `/api/learn/courses/*` - Quản lý khóa học
  - GET/POST/PUT/DELETE `/api/learn/enrollments/*` - Quản lý đăng ký

### MANAGER Role
- **Quyền**: Quản lý dữ liệu học tập và một số chức năng người dùng
- **API Core Endpoints**:
  - GET `/api/core/users` - Xem danh sách người dùng
  - GET `/api/core/auth/*` - Xác thực
  - GET `/api/core/health` - Kiểm tra sức khỏe
- **API Learning Endpoints**:
  - GET/POST/PUT/DELETE `/api/learn/students/*` - Quản lý học viên
  - GET/POST/PUT/DELETE `/api/learn/courses/*` - Quản lý khóa học
  - GET/POST/PUT/DELETE `/api/learn/enrollments/*` - Quản lý đăng ký

### USER Role
- **Quyền**: Chỉ truy cập dữ liệu cá nhân và xem thông tin cơ bản
- **API Core Endpoints**:
  - GET `/api/core/users/profile` - Xem thông tin cá nhân
  - PUT `/api/core/users/profile` - Cập nhật thông tin cá nhân
  - GET `/api/core/auth/*` - Xác thực
  - GET `/api/core/health` - Kiểm tra sức khỏe
- **API Learning Endpoints**:
  - GET `/api/learn/students/me` - Xem thông tin học viên cá nhân
  - GET `/api/learn/courses` - Xem danh sách khóa học
  - GET/POST `/api/learn/enrollments/me` - Xem/Đăng ký khóa học cá nhân

### STUDENT Role
- **Quyền**: Truy cập học tập và quản lý tiến độ cá nhân
- **API Core Endpoints**:
  - GET `/api/core/users/profile` - Xem thông tin cá nhân
  - PUT `/api/core/users/profile` - Cập nhật thông tin cá nhân
  - GET `/api/core/auth/*` - Xác thực
  - GET `/api/core/health` - Kiểm tra sức khỏe
- **API Learning Endpoints**:
  - GET `/api/learn/students/me` - Xem thông tin học viên cá nhân
  - GET `/api/learn/courses` - Xem danh sách khóa học
  - GET/POST `/api/learn/enrollments/me` - Xem/Đăng ký khóa học cá nhân
  - GET/POST `/api/learn/progress/*` - Xem/Cập nhật tiến độ học tập

## Lưu ý
- Cần có JWT token hợp lệ để truy cập các protected endpoints
- Token được lấy từ endpoint `/api/core/auth/login`
- Mỗi role có quyền truy cập khác nhau theo ma trận phân quyền ở trên
- Hệ thống sử dụng middleware để kiểm tra quyền truy cập