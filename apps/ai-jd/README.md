# AI JD Parsing & Matching Service

Service for parsing job descriptions and matching candidates using TF-IDF and linear scoring algorithms.

## Features

- **JD Parsing**: Extract technical skills, soft skills, and seniority level from job descriptions
- **Candidate Matching**: Rank candidates against job requirements with detailed scoring
- **TF-IDF Baseline**: Keyword-based skill extraction and matching
- **RESTful API**: FastAPI-based endpoints with automatic documentation

## API Endpoints

### 1. Parse Job Description
```
POST /api/ai/jd/parse_jd
```

**Request:**
```json
{
  "job_description": "We are looking for a Senior Python Developer with experience in Django, PostgreSQL, and AWS. Strong communication skills required.",
  "job_id": "job_123"
}
```

**Response:**
```json
{
  "skills": [
    {"name": "python", "weight": 0.8},
    {"name": "django", "weight": 0.6},
    {"name": "postgresql", "weight": 0.5},
    {"name": "aws", "weight": 0.4}
  ],
  "soft_skills": ["communication"],
  "seniority_hint": "senior",
  "job_id": "job_123"
}
```

### 2. Match Candidates
```
POST /api/ai/jd/match
```

**Request:**
```json
{
  "job_id": "job_123",
  "candidates": [
    {
      "student_id": "student_001",
      "skills": {
        "python": 4.5,
        "django": 4.0,
        "sql": 3.5
      },
      "eval_score": 85.0,
      "recent_projects": [
        {
          "name": "E-commerce Platform",
          "technologies": ["Python", "Django"],
          "completion_date": "2024-01-15"
        }
      ]
    }
  ],
  "top_k": 10,
  "weights": {
    "skill": 0.6,
    "eval": 0.3,
    "recency": 0.1
  }
}
```

**Response:**
```json
{
  "job_id": "job_123",
  "matches": [
    {
      "student_id": "student_001",
      "score": 87.5,
      "reasons": {
        "top_terms": ["python", "django"],
        "skill_gaps": ["aws"],
        "strengths": ["python (level 4.5)"]
      },
      "skill_score": 85.0,
      "eval_score": 85.0,
      "recency_score": 90.0
    }
  ],
  "total_candidates": 1,
  "processing_time_ms": 15.2
}
```

## Installation

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

3. Access the API:
- Service: http://localhost:8002
- Documentation: http://localhost:8002/docs
- Health check: http://localhost:8002/health

### Docker

1. Build the image:
```bash
docker build -t ai-jd-service .
```

2. Run the container:
```bash
docker run -p 8002:8002 ai-jd-service
```

## Testing

Run the test suite:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

## Project Structure

```
ai-jd/
├── main.py                 # FastAPI application
├── models/
│   ├── __init__.py
│   └── jd_models.py        # Pydantic models
├── services/
│   ├── __init__.py
│   ├── jd_parser.py        # JD parsing logic
│   └── candidate_matcher.py # Candidate matching logic
├── tests/
│   ├── __init__.py
│   └── test_main.py        # Test cases
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── pytest.ini            # Pytest configuration
└── README.md              # This file
```

## Algorithm Details

### JD Parsing
- **Skill Extraction**: Keyword matching against predefined skill database
- **Weight Calculation**: Based on frequency and context (requirements section)
- **Seniority Detection**: Pattern matching for experience indicators
- **Soft Skills**: Keyword matching for interpersonal skills

### Candidate Matching
- **Skill Scoring**: Direct and partial skill matching with level consideration
- **Evaluation Score**: Normalized 0-100 score
- **Recency Score**: Project completion date-based scoring
- **Linear Combination**: Weighted sum of skill, evaluation, and recency scores

## Configuration

### Scoring Weights (Default)
- Skill matching: 60%
- Evaluation score: 30%
- Project recency: 10%

### Skill Levels
- 0-1: Beginner
- 2-3: Intermediate
- 4-5: Advanced/Expert

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

## Health Monitoring

Health check endpoint: `GET /health`

Returns service status and basic information.