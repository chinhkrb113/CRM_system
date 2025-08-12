Hệ thống Quản lý Đào tạo & Tuyển dụng (AI-First)README này cung cấp tài liệu kỹ thuật tổng quan về Hệ thống Quản lý Đào tạo & Tuyển dụng, tập trung vào kiến trúc, công nghệ và hướng dẫn cài đặt cho các nhà phát triển.📖 Mục lụcKiến trúc hệ thốngCông nghệ sử dụngTính năng AI nổi bậtCài đặt và Chạy dự ánCấu trúc thư mụcĐóng góp🏗️ Kiến trúc hệ thốngHệ thống được xây dựng dựa trên kiến trúc Microservices kết hợp với các nguyên tắc của Domain-Driven Design (DDD) để đảm bảo tính module hóa, khả năng mở rộng và bảo trì dễ dàng.[Hình ảnh của Sơ đồ kiến trúc Microservices]Các Services chính:Mỗi service là một Bounded Context độc lập, chịu trách nhiệm cho một nghiệp vụ cụ thể:Consulting Service: Quản lý toàn bộ luồng tư vấn bán hàng, từ tiếp nhận lead, phân loại, đến chốt đơn và chăm sóc sau bán hàng.User Service: Quản lý thông tin và xác thực cho tất cả người dùng (học viên, nhân viên, admin).Enterprise Service: Xử lý các nghiệp vụ liên quan đến đối tác doanh nghiệp, bao gồm quản lý yêu cầu tuyển dụng và các dự án hợp tác.Course Service: Quản lý vòng đời của các khóa học, chương trình đào tạo và hồ sơ năng lực của học viên.Admin Service: Cung cấp các chức năng quản trị cấp cao, giám sát hệ thống và tạo báo cáo.API GatewayTất cả các yêu cầu từ Client (Web, Mobile) đều đi qua một API Gateway duy nhất. Gateway chịu trách nhiệm:Định tuyến (Routing): Chuyển tiếp yêu cầu đến service tương ứng.Xác thực (Authentication): Kiểm tra và xác thực token của người dùng.Rate Limiting & Caching: Giới hạn tần suất truy cập và cache các phản hồi phổ biến.💻 Công nghệ sử dụngThành phầnCông nghệFrontendReact.JSBackendNode.JSDatabaseMongoDBAI / MLPython, Scikit-learn (Random Forest Classifier), TensorFlow/PyTorch (Recommendation System)Kiến trúcMicroservices, Domain-Driven Design (DDD), RESTful API✨ Tính năng AI nổi bậtPhân loại & Đánh giá Học viên: Sử dụng mô hình Random Forest Classifier để phân tích đa chiều (điểm số, tương tác, chất lượng sản phẩm) và xếp loại năng lực học viên một cách khách quan.Gợi ý Ứng viên Tiềm năng: Hệ thống Recommendation System phân tích ngữ nghĩa của JD từ doanh nghiệp và đối sánh với "Bản đồ năng lực" của học viên để đưa ra gợi ý phù hợp nhất.Chấm điểm Khách hàng (Lead Scoring): Phân tích hành vi và nội dung tương tác để chấm điểm tiềm năng của khách hàng, giúp đội ngũ tư vấn tập trung vào các cơ hội chất lượng.Phát hiện Bất thường (Anomaly Detection): Giám sát các chỉ số vận hành và tự động cảnh báo khi có dấu hiệu bất thường, giúp quản trị viên phản ứng kịp thời.🚀 Cài đặt và Chạy dự ánYêu cầu tiên quyếtNode.js (v16.x trở lên)npm / yarnMongoDBDocker (Khuyến khích)Hướng dẫn cài đặtClone repository:git clone https://your-repository-url.com/project.git
cd project
Cài đặt dependencies cho từng service:Mỗi service là một project Node.js riêng biệt. Bạn cần vào từng thư mục service để cài đặt.# Ví dụ cho user-service
cd user-service
npm install
cd ..

# Lặp lại cho các service khác (consulting-service, course-service, etc.)
Cấu hình biến môi trường:Tạo file .env trong thư mục gốc của mỗi service từ file .env.example và cấu hình các thông tin cần thiết (VD: MONGO_URI, PORT, JWT_SECRET).Chạy các services:Bạn có thể chạy từng service trên các terminal khác nhau.# Terminal 1: Chạy user-service
cd user-service
npm start

# Terminal 2: Chạy course-service
cd course-service
npm start

# ... và các service khác
Chạy Frontend:cd frontend
npm install
npm start
Ứng dụng React sẽ chạy trên http://localhost:3000.