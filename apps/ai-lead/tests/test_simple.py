import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import LeadScoreRequest, FormField, HistoryInteraction
from services.lead_scoring import LeadScoringService

def test_valid_lead_score_request():
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

def test_invalid_page_views():
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

def test_form_field_schema():
    """Test FormField schema"""
    form_field = FormField(name="email", value="test@example.com", type="email")
    assert form_field.name == "email"
    assert form_field.value == "test@example.com"
    assert form_field.type == "email"

def test_history_interaction_schema():
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

@pytest.mark.asyncio
async def test_lead_scoring_service():
    """Test LeadScoringService basic functionality"""
    service = LeadScoringService()
    
    # Test if model file exists
    import os
    model_path = "models/lead_scoring_model.joblib"
    assert os.path.exists(model_path), "Model file should exist"
    
    # Load model
    await service.load_model()
    assert service.model is not None, "Model should be loaded"

if __name__ == "__main__":
    pytest.main(["-v", __file__])