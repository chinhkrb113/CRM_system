# Core API - Complete Documentation

## 🎯 Project Overview

Core API là hệ thống quản lý CRM với MySQL database, bao gồm:
- Quản lý Users, Leads, Appointments, Interactions, Payments
- JWT Authentication
- Swagger API Documentation
- Full CRUD operations cho tất cả entities

## ✅ Current Status

### Database MySQL đã được thiết lập hoàn chỉnh:
- Database: core_db trên MySQL Server
- Connection: mysql://root:@localhost:3306/core_db
- Tables: 5 bảng chính đã được tạo thành công
- Sample Data: Đã seed đầy đủ dữ liệu mẫu
- API Server: Đang chạy trên port 3001
- Swagger UI: http://localhost:3001/api/docs

### Database Tables:
- users (admin, manager, sales users)
- leads (potential customers)
- appointments (scheduled meetings)
- interactions (customer communications)
- payments (transaction records)

### Sample Data Created:
- 3 Users (Admin, Manager, Sales)
- Multiple Leads với different statuses
- Appointments với various statuses
- Interactions tracking customer communications
- Payment records với different statuses

## 🚀 Quick Start

### 1. Setup Database

#### Option A: XAMPP (Recommended for Windows)
1. Download XAMPP: https://www.apachefriends.org/download.html
2. Install và khởi động Apache + MySQL
3. Mở phpMyAdmin: http://localhost/phpmyadmin
4. Tạo database mới tên 'core_db'
5. Tạo user mới:
   - Username: core_user
   - Password: core_password
   - Grant all privileges on core_db

#### Option B: MySQL Server
1. Download MySQL: https://dev.mysql.com/downloads/mysql/
2. Install với root password: root
3. Tạo database:
   CREATE DATABASE core_db;
   CREATE USER 'core_user'@'localhost' IDENTIFIED BY 'core_password';
   GRANT ALL PRIVILEGES ON core_db.* TO 'core_user'@'localhost';
   FLUSH PRIVILEGES;

#### Option C: Automated Setup (PowerShell)
Chạy script tự động:
```powershell
.\setup-mysql-database.ps1
```

### 2. Environment Setup
Copy .env.example thành .env và update:
```
DATABASE_URL="mysql://root:@localhost:3306/core_db"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migration
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🔐 Authentication

### Generate JWT Token
```bash
node test-token.js
```

### Use Token in API
```
Authorization: Bearer <your-jwt-token>
```

### Sample Token
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTA3OTA3MSwiZXhwIjoxNzU1MTY1NDcxfQ.tqwrNOEp8ozvedEJIZ_NuMab_e3TdBMsYFc4AugbIJ0
```

## 📋 API Endpoints

### Authentication API
- POST /api/core/auth/login - User login
- POST /api/core/auth/register - User registration
- POST /api/core/auth/refresh - Refresh token
- POST /api/core/auth/logout - User logout

### Users API
- GET /api/core/users - Lấy danh sách users
- POST /api/core/users - Tạo user mới
- GET /api/core/users/{id} - Lấy thông tin chi tiết user
- PUT /api/core/users/{id} - Cập nhật user
- DELETE /api/core/users/{id} - Xóa user
- GET /api/core/users/profile - Lấy profile của current user

### Leads API
- GET /api/core/leads - Lấy danh sách leads
- POST /api/core/leads - Tạo lead mới
- GET /api/core/leads/{id} - Lấy thông tin chi tiết lead
- PUT /api/core/leads/{id} - Cập nhật lead
- DELETE /api/core/leads/{id} - Xóa lead
- GET /api/core/leads/stats - Thống kê leads
- PUT /api/core/leads/{id}/status - Cập nhật status của lead

### Appointments API
- GET /api/core/appointments - Lấy danh sách appointments
- POST /api/core/appointments - Tạo appointment mới
- GET /api/core/appointments/{id} - Lấy thông tin chi tiết appointment
- PUT /api/core/appointments/{id} - Cập nhật appointment
- DELETE /api/core/appointments/{id} - Xóa appointment
- GET /api/core/appointments/calendar - Lấy calendar view
- PUT /api/core/appointments/{id}/status - Cập nhật status

### Interactions API
- GET /api/core/interactions - Lấy danh sách interactions
- POST /api/core/interactions - Tạo interaction mới
- GET /api/core/interactions/{id} - Lấy thông tin chi tiết interaction
- PUT /api/core/interactions/{id} - Cập nhật interaction
- DELETE /api/core/interactions/{id} - Xóa interaction
- GET /api/core/interactions/lead/{leadId} - Lấy interactions của lead

### Payments API
- GET /api/core/payments - Lấy danh sách payments
- POST /api/core/payments - Tạo payment mới
- GET /api/core/payments/{id} - Lấy thông tin chi tiết payment
- PUT /api/core/payments/{id} - Cập nhật payment
- DELETE /api/core/payments/{id} - Xóa payment
- GET /api/core/payments/stats - Thống kê payments

### AI Services API
- POST /api/core/ai/analyze-lead - Phân tích lead bằng AI
- POST /api/core/ai/generate-response - Tạo response tự động
- POST /api/core/ai/predict-conversion - Dự đoán conversion rate

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### API Testing với curl
```bash
# Health check
curl http://localhost:3001/health

# Get users (with auth)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/core/users

# Create lead
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}' \
  http://localhost:3001/api/core/leads
```

## 🐳 Docker Support

### Development với Docker
```bash
# Start MySQL only
docker-compose -f docker-compose.mysql.yml up -d

# Start full development environment
docker-compose -f docker-compose.dev.yml up -d
```

### Production Build
```bash
docker build -t crm-core-api .
docker run -p 3001:3001 crm-core-api
```

## 📊 Database Management

### Prisma Commands
```bash
# Generate client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Database Backup
```bash
mysqldump -u root -p core_db > backup.sql
mysql -u root -p core_db < backup.sql
```

## 🔧 Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── config/               # Configuration files
├── controllers/          # Route controllers
├── middleware/           # Express middleware
├── routes/              # API routes
├── services/            # Business logic
├── lib/                 # Utilities and libraries
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
└── __tests__/           # Test files
```

### Code Style
```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

## 🚀 Deployment

### Environment Variables
```
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### Production Checklist
- [ ] Update JWT_SECRET với strong secret
- [ ] Configure CORS_ORIGIN cho production domain
- [ ] Setup production database
- [ ] Configure logging level
- [ ] Setup monitoring và health checks
- [ ] Configure rate limiting
- [ ] Setup SSL/TLS

## 📚 API Documentation

### Swagger UI
Truy cập: http://localhost:3001/api/docs

### API Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL server is running
   - Verify DATABASE_URL in .env
   - Check database exists

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using port: `netstat -ano | findstr :3001`

3. **Prisma Generate Error**
   - Delete node_modules và reinstall
   - Run `npx prisma generate` manually

4. **JWT Token Invalid**
   - Check JWT_SECRET matches between .env và test-token.js
   - Generate new token với `node test-token.js`

### Logs
```bash
# View application logs
npm run dev

# Database logs
npx prisma studio
```

## 📞 Support

Nếu gặp vấn đề:
1. Check troubleshooting section
2. Review API documentation
3. Check database connection
4. Verify environment variables

---

**Happy Coding! 🚀**