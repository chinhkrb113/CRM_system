import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from models.schemas import LeadScoreRequest, LeadScoreResponse, FormField, HistoryInteraction
from services.lead_scoring import LeadScoringService

# Create test client
client = TestClient(app)

class TestLeadScoringSchemas:
    """Test pydantic schema validation"""
    
    def test_valid_lead_score_request(self):
        """Test valid LeadScoreRequest creation"""
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
            "historyInteractions": [
                {
                    "type": "email",
                    "timestamp": "2024-01-15T10:00:00Z",
                    "outcome": "opened"
                }
            ]
        }
        
        request = LeadScoreRequest(**request_data)
        assert request.source == "website"
        assert request.pageViews == 5
        assert len(request.formFields) == 1
        assert len(request.lastMessages) == 1
    
    def test_invalid_page_views(self):
        """Test invalid pageViews (negative number)"""
        request_data = {
            "source": "website",
            "channel": "organic_search",
            "pageViews": -1,  # Invalid
            "pages": ["/pricing"],
            "timeOnSite": 300,
            "formFields": [],
            "lastMessages": ["test message"]
        }
        
        with pytest.raises(ValueError):
            LeadScoreRequest(**request_data)
    
    def test_missing_required_fields(self):
        """Test missing required fields"""
        request_data = {
            "source": "website",
            # Missing channel, pageViews, etc.
        }
        
        with pytest.raises(ValueError):
            LeadScoreRequest(**request_data)
    
    def test_form_field_schema(self):
        """Test FormField schema"""
        form_field = FormField(name="email", value="test@example.com", type="email")
        assert form_field.name == "email"
        assert form_field.value == "test@example.com"
        assert form_field.type == "email"
    
    def test_history_interaction_schema(self):
        """Test HistoryInteraction schema"""
        interaction = HistoryInteraction(
            type="call",
            timestamp="2024-01-15T10:00:00Z",
            outcome="completed",
            duration=300,
            notes="Good conversation"
        )
        assert interaction.type == "call"
        assert interaction.duration == 300

class TestLeadScoringService:
    """Test LeadScoringService functionality"""
    
    @pytest.fixture
    async def scoring_service(self):
        """Create a scoring service instance for testing"""
        service = LeadScoringService()
        # Mock the model loading to avoid file I/O in tests
        with patch.object(service, 'load_model') as mock_load:
            mock_load.return_value = None
            service.model = MagicMock()
            service.model.predict_proba.return_value = [[0.3, 0.7]]  # Mock prediction
            yield service
    
    @pytest.mark.asyncio
    async def test_score_calculation(self, scoring_service):
        """Test score calculation logic"""
        request = LeadScoreRequest(
            source="website",
            channel="organic_search",
            pageViews=5,
            pages=["/pricing", "/enterprise"],
            timeOnSite=400,
            formFields=[
                FormField(name="company", value="Tech Corp", type="text"),
                FormField(name="budget", value="50000", type="number")
            ],
            lastMessages=["Interested in enterprise solution", "Need pricing"],
            historyInteractions=[]
        )
        
        result = await scoring_service.score_lead(request)
        
        assert 0 <= result.score <= 1
        assert isinstance(result.top_features, list)
        assert len(result.top_features) <= 5
        assert result.category in ["hot", "warm", "cold"]
        assert result.confidence is not None
    
    @pytest.mark.asyncio
    async def test_high_score_features(self, scoring_service):
        """Test that high-value features contribute to higher scores"""
        high_value_request = LeadScoreRequest(
            source="referral",  # High-value source
            channel="direct",
            pageViews=10,  # High page views
            pages=["/pricing", "/enterprise", "/contact"],  # Important pages
            timeOnSite=600,  # Long session
            formFields=[
                FormField(name="company", value="Enterprise Corp", type="text"),
                FormField(name="budget", value="100000", type="number"),
                FormField(name="timeline", value="immediate", type="text")
            ],
            lastMessages=["Ready to purchase enterprise solution", "Urgent requirement"],
            historyInteractions=[]
        )
        
        result = await scoring_service.score_lead(high_value_request)
        
        # Should have high-value features
        expected_features = ["high_page_views", "long_session_duration", "high_intent_keywords"]
        assert any(feature in result.top_features for feature in expected_features)
    
    def test_request_to_dataframe_conversion(self):
        """Test conversion of request to DataFrame format"""
        service = LeadScoringService()
        request = LeadScoreRequest(
            source="website",
            channel="organic_search",
            pageViews=3,
            pages=["/home"],
            timeOnSite=150,
            formFields=[FormField(name="email", value="test@example.com")],
            lastMessages=["Hello", "World"],
            historyInteractions=[]
        )
        
        df = service._request_to_dataframe(request)
        
        assert len(df) == 1
        assert df.iloc[0]['source'] == "website"
        assert df.iloc[0]['page_views'] == 3
        assert df.iloc[0]['messages'] == "Hello World"
        assert df.iloc[0]['num_form_fields'] == 1

class TestAPIEndpoints:
    """Test FastAPI endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-lead"
    
    @patch('services.lead_scoring.LeadScoringService.score_lead')
    def test_score_endpoint_success(self, mock_score_lead):
        """Test successful lead scoring endpoint"""
        # Mock the scoring service response
        from models.schemas import LeadScoreData
        mock_score_lead.return_value = LeadScoreData(
            score=0.75,
            top_features=["high_page_views", "pricing_page_visit"],
            confidence=0.85,
            category="warm"
        )
        
        request_data = {
            "source": "website",
            "channel": "organic_search",
            "pageViews": 5,
            "pages": ["/pricing"],
            "timeOnSite": 300,
            "formFields": [{"name": "email", "value": "test@example.com"}],
            "lastMessages": ["Interested in pricing"],
            "historyInteractions": []
        }
        
        response = client.post("/api/ai/lead/score", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["error"] is None
        assert data["data"]["score"] == 0.75
        assert "high_page_views" in data["data"]["top_features"]
    
    def test_score_endpoint_invalid_data(self):
        """Test lead scoring endpoint with invalid data"""
        invalid_request = {
            "source": "website",
            "pageViews": -1,  # Invalid
            # Missing required fields
        }
        
        response = client.post("/api/ai/lead/score", json=invalid_request)
        assert response.status_code == 422  # Validation error

# Sample test data for manual testing
SAMPLE_REQUESTS = {
    "high_quality_lead": {
        "source": "referral",
        "channel": "partner",
        "pageViews": 8,
        "pages": ["/pricing", "/enterprise", "/contact", "/demo"],
        "timeOnSite": 450,
        "formFields": [
            {"name": "company", "value": "Enterprise Corp", "type": "text"},
            {"name": "budget", "value": "100000", "type": "number"},
            {"name": "employees", "value": "500", "type": "number"}
        ],
        "lastMessages": [
            "We need an enterprise solution for 500 employees",
            "Budget approved for $100k",
            "When can we schedule a demo?"
        ],
        "historyInteractions": [
            {
                "type": "email",
                "timestamp": "2024-01-15T10:00:00Z",
                "outcome": "opened",
                "notes": "Clicked all links"
            }
        ]
    },
    "low_quality_lead": {
        "source": "cold_call",
        "channel": "outbound",
        "pageViews": 1,
        "pages": ["/home"],
        "timeOnSite": 30,
        "formFields": [],
        "lastMessages": ["Just browsing"],
        "historyInteractions": []
    }
}

if __name__ == "__main__":
    pytest.main(["-v", __file__])