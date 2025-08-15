# AI Lead Scoring Service

Dịch vụ AI để tính điểm khách hàng tiềm năng (Lead Scoring) sử dụng Machine Learning với FastAPI.

## Tổng quan

Service này nhận thông tin về lead (demographic, web behaviors, lastMessages) và trả về điểm số từ 0-1 cùng với các đặc trưng quan trọng nhất.

### Mô hình ML
- **TfidfVectorizer**: Xử lý text từ `lastMessages`
- **LogisticRegression**: Tính điểm lead scoring
- **Pipeline**: Kết hợp preprocessing và prediction
- **Joblib**: Lưu trữ và tải model

## API Endpoints

### POST /api/ai/lead/score

Tính điểm cho một lead dựa trên thông tin đầu vào.

**Request Body:**
```json
{
  "source": "website",
  "channel": "organic_search", 
  "pageViews": 5,
  "pages": ["/pricing", "/features"],
  "timeOnSite": 300,
  "formFields": [
    {
      "name": "company",
      "value": "Tech Corp",
      "type": "text"
    }
  ],
  "lastMessages": [
    "Interested in enterprise solution",
    "Need pricing information"
  ],
  "historyInteractions": [
    {
      "type": "email",
      "timestamp": "2024-01-15T10:00:00Z",
      "outcome": "opened",
      "duration": 120,
      "notes": "Clicked pricing link"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "score": 0.75,
    "top_features": [
      "high_page_views",
      "pricing_page_visit", 
      "high_intent_keywords",
      "long_session_duration",
      "form_completion"
    ],
    "confidence": 0.85,
    "category": "warm"
  },
  "error": null
}
```

### GET /health

Kiểm tra trạng thái service.

**Response:**
```json
{
  "status": "healthy",
  "service": "ai-lead",
  "model_loaded": true,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Cài đặt và Chạy

### 1. Local Development

```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
uvicorn main:app --reload --port 8000

# Hoặc với hot reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Docker

```bash
# Build image
docker build -t ai-lead-scoring .

# Run container
docker run -p 8000:8000 ai-lead-scoring

# Run với environment variables
docker run -p 8000:8000 \
  -e MODEL_PATH=/app/models/saved/lead_scoring_model.joblib \
  -e VECTORIZER_PATH=/app/models/saved/tfidf_vectorizer.joblib \
  ai-lead-scoring
```

### 3. Docker Compose

```yaml
version: '3.8'
services:
  ai-lead:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/models/saved/lead_scoring_model.joblib
      - VECTORIZER_PATH=/app/models/saved/tfidf_vectorizer.joblib
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Testing

### Chạy Unit Tests

```bash
# Chạy tất cả tests
pytest

# Chạy với coverage
pytest --cov=. --cov-report=html

# Chạy specific test file
pytest tests/test_lead_scoring.py -v

# Chạy specific test
pytest tests/test_lead_scoring.py::TestLeadScoringService::test_score_calculation -v
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test scoring endpoint
curl -X POST http://localhost:8000/api/ai/lead/score \
  -H "Content-Type: application/json" \
  -d '{
    "source": "website",
    "channel": "organic_search",
    "pageViews": 5,
    "pages": ["/pricing"],
    "timeOnSite": 300,
    "formFields": [{"name": "email", "value": "test@example.com"}],
    "lastMessages": ["Interested in pricing"],
    "historyInteractions": []
  }'
```

## Cấu trúc Project

```
ai-lead/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── README.md              # Documentation
├── models/
│   ├── __init__.py
│   ├── schemas.py         # Pydantic models
│   └── saved/             # Trained ML models
│       ├── lead_scoring_model.joblib
│       └── tfidf_vectorizer.joblib
├── services/
│   ├── __init__.py
│   └── lead_scoring.py    # ML pipeline & scoring logic
└── tests/
    ├── __init__.py
    └── test_lead_scoring.py # Unit tests
```

## Features

### Scoring Features

Service tính toán các đặc trưng sau để đánh giá lead:

1. **Behavioral Features:**
   - `high_page_views`: Số lượng trang xem cao (>= 5)
   - `long_session_duration`: Thời gian trên site dài (>= 300s)
   - `pricing_page_visit`: Đã xem trang pricing
   - `contact_page_visit`: Đã xem trang contact
   - `demo_page_visit`: Đã xem trang demo

2. **Engagement Features:**
   - `form_completion`: Đã điền form
   - `multiple_form_fields`: Điền nhiều trường form (>= 3)
   - `high_intent_keywords`: Có từ khóa ý định cao trong messages
   - `enterprise_keywords`: Có từ khóa enterprise
   - `budget_mentioned`: Có đề cập đến budget

3. **Source Features:**
   - `referral_source`: Nguồn từ referral
   - `direct_channel`: Kênh direct
   - `paid_channel`: Kênh paid advertising

### Scoring Categories

- **Hot** (0.7-1.0): Lead chất lượng cao, sẵn sàng mua
- **Warm** (0.4-0.7): Lead tiềm năng, cần nurture
- **Cold** (0.0-0.4): Lead chất lượng thấp

## Model Training

Service tự động tạo synthetic data và train model khi khởi động lần đầu:

```python
# Model sẽ được lưu tại:
# - models/saved/lead_scoring_model.joblib
# - models/saved/tfidf_vectorizer.joblib
```

### Retrain Model

```python
from services.lead_scoring import LeadScoringService

service = LeadScoringService()
await service.train_model()  # Train với synthetic data mới
```

## Environment Variables

- `MODEL_PATH`: Đường dẫn đến file model (default: `models/saved/lead_scoring_model.joblib`)
- `VECTORIZER_PATH`: Đường dẫn đến file vectorizer (default: `models/saved/tfidf_vectorizer.joblib`)
- `LOG_LEVEL`: Mức độ logging (default: `INFO`)

## API Documentation

Khi service chạy, truy cập:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Performance

- **Response time**: < 100ms cho single prediction
- **Throughput**: ~1000 requests/second
- **Memory usage**: ~200MB với model loaded
- **Model size**: ~5MB (TfidfVectorizer + LogisticRegression)

## Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:8000/health

# Docker health check
docker ps  # Check HEALTHY status
```

### Logs

```bash
# View logs
docker logs <container_id>

# Follow logs
docker logs -f <container_id>
```

## Troubleshooting

### Common Issues

1. **Model not found**: Đảm bảo model files tồn tại trong `models/saved/`
2. **Import errors**: Kiểm tra PYTHONPATH và cấu trúc thư mục
3. **Memory issues**: Tăng memory limit cho container
4. **Port conflicts**: Thay đổi port mapping

### Debug Mode

```bash
# Chạy với debug logging
LOG_LEVEL=DEBUG uvicorn main:app --reload
```

## Contributing

1. Tạo feature branch
2. Implement changes
3. Chạy tests: `pytest`
4. Update documentation
5. Submit pull request

## License

Internal CRM System - Proprietary