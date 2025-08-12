# Hệ thống Quản lý Đào tạo & Tuyển dụng (AI-First)

README này cung cấp tài liệu kỹ thuật tổng quan về Hệ thống Quản lý Đào tạo & Tuyển dụng, tập trung vào kiến trúc, công nghệ và hướng dẫn cài đặt cho các nhà phát triển.

## 📖 Mục lục

- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Tính năng AI nổi bật](#tính-năng-ai-nổi-bật)
- [Cài đặt và Chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Đóng góp](#đóng-góp)

## 🏗️ Kiến trúc hệ thống

Hệ thống được xây dựng dựa trên kiến trúc **Microservices** kết hợp với các nguyên tắc của **Domain-Driven Design (DDD)** để đảm bảo tính module hóa, khả năng mở rộng và bảo trì dễ dàng.

### Các Services chính:

Mỗi service là một Bounded Context độc lập, chịu trách nhiệm cho một nghiệp vụ cụ thể:

1.  **`Consulting Service`**: Quản lý toàn bộ luồng tư vấn bán hàng, từ tiếp nhận lead, phân loại, đến chốt đơn và chăm sóc sau bán hàng.
2.  **`User Service`**: Quản lý thông tin và xác thực cho tất cả người dùng (học viên, nhân viên, admin).
3.  **`Enterprise Service`**: Xử lý các nghiệp vụ liên quan đến đối tác doanh nghiệp, bao gồm quản lý yêu cầu tuyển dụng và các dự án hợp tác.
4.  **`Course Service`**: Quản lý vòng đời của các khóa học, chương trình đào tạo và hồ sơ năng lực của học viên.
5.  **`Admin Service`**: Cung cấp các chức năng quản trị cấp cao, giám sát hệ thống và tạo báo cáo.

### API Gateway

Tất cả các yêu cầu từ Client (Web, Mobile) đều đi qua một API Gateway duy nhất. Gateway chịu trách nhiệm:

-   **Định tuyến (Routing)**: Chuyển tiếp yêu cầu đến service tương ứng.
-   **Xác thực (Authentication)**: Kiểm tra và xác thực token của người dùng.
-   **Rate Limiting & Caching**: Giới hạn tần suất truy cập và cache các phản hồi phổ biến.

## 💻 Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | `React.JS` |
| **Backend** | `Node.JS` |
| **Database** | `MongoDB` |
| **AI / ML** | `Python`, `Scikit-learn` (Random Forest Classifier), `TensorFlow/PyTorch` (Recommendation System) |
| **Kiến trúc** | `Microservices`, `Domain-Driven Design (DDD)`, `RESTful API` |

## ✨ Tính năng AI nổi bật

-   **Phân loại & Đánh giá Học viên**: Sử dụng mô hình `Random Forest Classifier` để phân tích đa chiều (điểm số, tương tác, chất lượng sản phẩm) và xếp loại năng lực học viên một cách khách quan.
-   **Gợi ý Ứng viên Tiềm năng**: Hệ thống `Recommendation System` phân tích ngữ nghĩa của JD từ doanh nghiệp và đối sánh với "Bản đồ năng lực" của học viên để đưa ra gợi ý phù hợp nhất.
-   **Chấm điểm Khách hàng (Lead Scoring)**: Phân tích hành vi và nội dung tương tác để chấm điểm tiềm năng của khách hàng, giúp đội ngũ tư vấn tập trung vào các cơ hội chất lượng.
-   **Phát hiện Bất thường (Anomaly Detection)**: Giám sát các chỉ số vận hành và tự động cảnh báo khi có dấu hiệu bất thường, giúp quản trị viên phản ứng kịp thời.

## 🚀 Cài đặt và Chạy dự án

### Yêu cầu tiên quyết

-   Node.js (v16.x trở lên)
-   npm / yarn
-   MongoDB
-   Docker (Khuyến khích)

### Hướng dẫn cài đặt

1.  **Clone repository:**
    ```bash
    git clone [https://your-repository-url.com/project.git](https://your-repository-url.com/project.git)
    cd project
    ```

2.  **Cài đặt dependencies cho từng service:**
    Mỗi service là một project Node.js riêng biệt. Bạn cần vào từng thư mục service để cài đặt.
    ```bash
    # Ví dụ cho user-service
    cd user-service
    npm install
    cd ..
    
    # Lặp lại cho các service khác (consulting-service, course-service, etc.)
    ```

3.  **Cấu hình biến môi trường:**
    Tạo file `.env` trong thư mục gốc của mỗi service từ file `.env.example` và cấu hình các thông tin cần thiết (VD: `MONGO_URI`, `PORT`, `JWT_SECRET`).

4.  **Chạy các services:**
    Bạn có thể chạy từng service trên các terminal khác nhau.
    ```bash
    # Terminal 1: Chạy user-service
    cd user-service
    npm start
    
    # Terminal 2: Chạy course-service
    cd course-service
    npm start
    
    # ... và các service khác
    ```

5.  **Chạy Frontend:**
    ```bash
    cd frontend
    npm install
    npm start
    ```
    Ứng dụng React sẽ chạy trên `http://localhost:3000`.

## 📁 Cấu trúc thư mục

Dự án được tổ chức theo kiến trúc monorepo (hoặc có thể là multi-repo), với mỗi service nằm trong một thư mục riêng.

```
/
├── api-gateway/          # Cấu hình API Gateway
├── consulting-service/   # Service quản lý tư vấn
├── course-service/       # Service quản lý khóa học
├── enterprise-service/   # Service quản lý doanh nghiệp
├── user-service/         # Service quản lý người dùng
├── frontend/             # Ứng dụng React.JS
└── docker-compose.yml    # File cấu hình để chạy toàn bộ hệ thống với Docker
```

## 🤝 Đóng góp

Chúng tôi luôn chào đón các đóng góp để cải thiện hệ thống. Vui lòng tuân thủ các quy tắc sau:

1.  **Fork** repository này.
2.  Tạo một **branch** mới cho tính năng của bạn (`git checkout -b feature/AmazingFeature`).
3.  **Commit** các thay đổi của bạn (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** lên branch (`git push origin feature/AmazingFeature`).
5.  Mở một **Pull Request**.

Vui lòng đảm bảo rằng code của bạn tuân thủ coding style của dự án và đã được test kỹ lưỡng.
