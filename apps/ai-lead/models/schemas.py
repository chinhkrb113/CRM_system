from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FormField(BaseModel):
    """Form field data"""
    name: str
    value: str
    type: Optional[str] = None

class HistoryInteraction(BaseModel):
    """Historical interaction data"""
    type: str  # email, call, meeting, etc.
    timestamp: str
    outcome: Optional[str] = None
    duration: Optional[int] = None
    notes: Optional[str] = None

class LeadScoreRequest(BaseModel):
    """Request model for lead scoring"""
    source: str = Field(..., description="Lead source (website, social_media, referral, etc.)")
    channel: str = Field(..., description="Marketing channel")
    pageViews: int = Field(..., ge=0, description="Number of page views")
    pages: List[str] = Field(..., description="List of pages visited")
    timeOnSite: int = Field(..., ge=0, description="Time spent on site in seconds")
    formFields: List[FormField] = Field(..., description="Form fields submitted")
    lastMessages: List[str] = Field(..., description="Recent messages/communications")
    historyInteractions: List[HistoryInteraction] = Field(default=[], description="Historical interactions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "source": "website",
                "channel": "organic_search",
                "pageViews": 5,
                "pages": ["/pricing", "/features", "/contact"],
                "timeOnSite": 300,
                "formFields": [
                    {"name": "company", "value": "Tech Corp", "type": "text"},
                    {"name": "budget", "value": "50000", "type": "number"}
                ],
                "lastMessages": [
                    "Interested in enterprise solution",
                    "Need pricing for 100 users"
                ],
                "historyInteractions": [
                    {
                        "type": "email",
                        "timestamp": "2024-01-15T10:00:00Z",
                        "outcome": "opened",
                        "notes": "Clicked pricing link"
                    }
                ]
            }
        }

class LeadScoreData(BaseModel):
    """Lead score result data"""
    score: float = Field(..., ge=0, le=1, description="Lead score between 0 and 1")
    top_features: List[str] = Field(..., description="Top features contributing to the score")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Model confidence")
    category: Optional[str] = Field(None, description="Lead category (hot, warm, cold)")

class LeadScoreResponse(BaseModel):
    """Response model for lead scoring"""
    data: Optional[LeadScoreData] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": {
                    "score": 0.85,
                    "top_features": [
                        "high_page_views",
                        "pricing_page_visit",
                        "enterprise_keywords"
                    ],
                    "confidence": 0.92,
                    "category": "hot"
                },
                "error": None
            }
        }