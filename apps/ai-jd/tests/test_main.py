import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestJDParsingEndpoint:
    """Test cases for JD parsing endpoint"""
    
    def test_parse_jd_basic(self):
        """Test basic JD parsing functionality"""
        payload = {
            "job_description": "We are looking for a Senior Python Developer with experience in Django, FastAPI, PostgreSQL, and AWS. Strong communication and leadership skills required. 5+ years of experience needed.",
            "job_id": "job_001"
        }
        
        response = client.post("/api/ai/jd/parse_jd", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "skills" in data
        assert "soft_skills" in data
        assert "seniority_hint" in data
        assert "job_id" in data
        assert data["job_id"] == "job_001"
        
        # Check if Python is detected
        skill_names = [skill["name"] for skill in data["skills"]]
        assert "python" in skill_names
        
        # Check seniority detection
        assert data["seniority_hint"] in ["junior", "mid", "senior", "lead", "principal"]
    
    def test_parse_jd_without_job_id(self):
        """Test JD parsing without job_id"""
        payload = {
            "job_description": "Junior Frontend Developer position. React, JavaScript, HTML, CSS required. Entry level position for recent graduates."
        }
        
        response = client.post("/api/ai/jd/parse_jd", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["job_id"] is None
        assert data["seniority_hint"] == "junior"
    
    def test_parse_jd_machine_learning_role(self):
        """Test parsing ML/AI role"""
        payload = {
            "job_description": "Principal Machine Learning Engineer. TensorFlow, PyTorch, Python, SQL, AWS required. 10+ years experience in AI/ML. Leadership and mentoring skills essential.",
            "job_id": "ml_job_001"
        }
        
        response = client.post("/api/ai/jd/parse_jd", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        skill_names = [skill["name"] for skill in data["skills"]]
        
        # Check for ML-related skills
        ml_skills_found = any(skill in skill_names for skill in ["tensorflow", "pytorch", "machine learning"])
        assert ml_skills_found
        
        # Check soft skills
        assert "leadership" in data["soft_skills"]
        
        # Check seniority
        assert data["seniority_hint"] == "principal"
    
    def test_parse_jd_empty_description(self):
        """Test with empty job description"""
        payload = {
            "job_description": ""
        }
        
        response = client.post("/api/ai/jd/parse_jd", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["skills"]) == 0
        assert len(data["soft_skills"]) == 0
    
    def test_parse_jd_info_endpoint(self):
        """Test GET endpoint for JD parsing info"""
        response = client.get("/api/ai/jd/parse_jd")
        assert response.status_code == 200
        
        data = response.json()
        assert "endpoint" in data
        assert "method" in data
        assert "description" in data
        assert data["method"] == "POST"

class TestCandidateMatchingEndpoint:
    """Test cases for candidate matching endpoint"""
    
    def test_match_candidates_basic(self):
        """Test basic candidate matching functionality"""
        payload = {
            "job_id": "job_001",
            "candidates": [
                {
                    "student_id": "student_001",
                    "skills": {
                        "python": 4.5,
                        "django": 4.0,
                        "sql": 3.5,
                        "aws": 3.0
                    },
                    "eval_score": 85.0,
                    "recent_projects": [
                        {
                            "name": "E-commerce Platform",
                            "description": "Django-based e-commerce site",
                            "technologies": ["Python", "Django", "PostgreSQL"],
                            "completion_date": "2024-01-15"
                        }
                    ]
                },
                {
                    "student_id": "student_002",
                    "skills": {
                        "javascript": 4.0,
                        "react": 4.5,
                        "nodejs": 3.5
                    },
                    "eval_score": 78.0,
                    "recent_projects": []
                }
            ],
            "top_k": 5,
            "weights": {
                "skill": 0.6,
                "eval": 0.3,
                "recency": 0.1
            }
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "job_id" in data
        assert "matches" in data
        assert "total_candidates" in data
        assert "processing_time_ms" in data
        
        assert data["job_id"] == "job_001"
        assert data["total_candidates"] == 2
        assert len(data["matches"]) <= 5
        
        # Check match structure
        for match in data["matches"]:
            assert "student_id" in match
            assert "score" in match
            assert "reasons" in match
            assert "skill_score" in match
            assert "eval_score" in match
            assert "recency_score" in match
            
            # Check reasons structure
            reasons = match["reasons"]
            assert "top_terms" in reasons
            assert "skill_gaps" in reasons
            assert "strengths" in reasons
    
    def test_match_candidates_with_defaults(self):
        """Test matching with default weights and top_k"""
        payload = {
            "job_id": "job_002",
            "candidates": [
                {
                    "student_id": "student_003",
                    "skills": {
                        "python": 5.0,
                        "machine learning": 4.5
                    },
                    "eval_score": 92.0,
                    "recent_projects": []
                }
            ]
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["matches"]) == 1
        assert data["matches"][0]["student_id"] == "student_003"
    
    def test_match_candidates_empty_list(self):
        """Test matching with empty candidate list"""
        payload = {
            "job_id": "job_003",
            "candidates": [],
            "top_k": 5
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_candidates"] == 0
        assert len(data["matches"]) == 0
    
    def test_match_candidates_large_dataset(self):
        """Test matching with larger candidate dataset"""
        candidates = []
        for i in range(15):
            candidates.append({
                "student_id": f"student_{i:03d}",
                "skills": {
                    "python": 2.0 + (i % 4),
                    "sql": 1.0 + (i % 5),
                    "communication": 3.0 + (i % 3)
                },
                "eval_score": 60.0 + (i * 2),
                "recent_projects": []
            })
        
        payload = {
            "job_id": "job_004",
            "candidates": candidates,
            "top_k": 10
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_candidates"] == 15
        assert len(data["matches"]) == 10  # Should return top 10
        
        # Check that results are sorted by score (descending)
        scores = [match["score"] for match in data["matches"]]
        assert scores == sorted(scores, reverse=True)
    
    def test_match_candidates_info_endpoint(self):
        """Test GET endpoint for candidate matching info"""
        response = client.get("/api/ai/jd/match")
        assert response.status_code == 200
        
        data = response.json()
        assert "endpoint" in data
        assert "method" in data
        assert "description" in data
        assert data["method"] == "POST"

class TestHealthAndRoot:
    """Test health check and root endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert "status" in data
        assert "endpoints" in data
        
        assert data["service"] == "AI JD Parsing & Matching"
        assert data["status"] == "running"
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-jd"

class TestValidation:
    """Test input validation"""
    
    def test_parse_jd_missing_description(self):
        """Test JD parsing with missing job_description"""
        payload = {
            "job_id": "job_001"
        }
        
        response = client.post("/api/ai/jd/parse_jd", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_match_candidates_missing_job_id(self):
        """Test candidate matching with missing job_id"""
        payload = {
            "candidates": [
                {
                    "student_id": "student_001",
                    "skills": {"python": 4.0},
                    "eval_score": 85.0,
                    "recent_projects": []
                }
            ]
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_match_candidates_invalid_eval_score(self):
        """Test candidate matching with invalid eval_score"""
        payload = {
            "job_id": "job_001",
            "candidates": [
                {
                    "student_id": "student_001",
                    "skills": {"python": 4.0},
                    "eval_score": 150.0,  # Invalid: > 100
                    "recent_projects": []
                }
            ]
        }
        
        response = client.post("/api/ai/jd/match", json=payload)
        assert response.status_code == 422  # Validation error