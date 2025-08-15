import pytest
import requests
import time

# Test against running server
BASE_URL = "http://localhost:8001"

def test_health_endpoint():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "service": "ai-lead"}
    except requests.exceptions.ConnectionError:
        pytest.skip("Server not running")

def test_lead_score_endpoint_valid_request():
    """Test lead scoring with valid request"""
    request_data = {
        "source": "website",
        "channel": "organic_search",
        "pageViews": 5,
        "pages": ["/pricing", "/features"],
        "timeOnSite": 300,
        "formFields": [
            {"name": "company", "value": "Tech Corp", "type": "text"}
        ],
        "lastMessages": ["Interested in enterprise solution"],
        "historyInteractions": []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/ai/lead/score", json=request_data)
        assert response.status_code == 200
        
        response_data = response.json()
        assert "data" in response_data
        data = response_data["data"]
        assert "score" in data
        assert "confidence" in data
        assert "top_features" in data
        assert 0 <= data["score"] <= 1
        assert 0 <= data["confidence"] <= 1
        assert isinstance(data["top_features"], list)
    except requests.exceptions.ConnectionError:
        pytest.skip("Server not running")

def test_lead_score_endpoint_minimal_request():
    """Test lead scoring with minimal required fields"""
    request_data = {
        "source": "email",
        "channel": "newsletter",
        "pageViews": 1,
        "pages": [],
        "timeOnSite": 30,
        "formFields": [],
        "lastMessages": [],
        "historyInteractions": []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/ai/lead/score", json=request_data)
        assert response.status_code == 200
        
        response_data = response.json()
        assert "data" in response_data
        data = response_data["data"]
        assert "score" in data
        assert "confidence" in data
        assert "top_features" in data
    except requests.exceptions.ConnectionError:
        pytest.skip("Server not running")

def test_lead_score_endpoint_with_history():
    """Test lead scoring with history interactions"""
    request_data = {
        "source": "website",
        "channel": "paid_search",
        "pageViews": 10,
        "pages": ["/pricing", "/demo", "/contact"],
        "timeOnSite": 600,
        "formFields": [
            {"name": "email", "value": "test@company.com", "type": "email"},
            {"name": "phone", "value": "+1234567890", "type": "tel"}
        ],
        "lastMessages": [
            "Need enterprise pricing",
            "When can we schedule a demo?"
        ],
        "historyInteractions": [
            {
                "type": "email_open",
                "timestamp": "2024-01-01T10:00:00Z",
                "metadata": {"campaign": "product_launch"}
            },
            {
                "type": "form_submit",
                "timestamp": "2024-01-02T14:30:00Z",
                "metadata": {"form_name": "contact_us"}
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/ai/lead/score", json=request_data)
        assert response.status_code == 200
        
        response_data = response.json()
        assert "data" in response_data
        data = response_data["data"]
        assert "score" in data
        assert "confidence" in data
        assert "top_features" in data
        # High engagement should result in higher score
        assert data["score"] > 0.5
    except requests.exceptions.ConnectionError:
        pytest.skip("Server not running")