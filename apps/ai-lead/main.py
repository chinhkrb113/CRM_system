from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os

from models.schemas import LeadScoreRequest, LeadScoreResponse
from services.lead_scoring import LeadScoringService

# Initialize the scoring service
scoring_service = LeadScoringService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML model
    await scoring_service.load_model()
    yield
    # Shutdown: Clean up if needed
    pass

app = FastAPI(
    title="AI Lead Scoring Service",
    description="AI Service for Lead Scoring using ML models",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "AI Lead Scoring Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "score_lead": "/api/ai/lead/score",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-lead"}

@app.get("/api/ai/lead/score")
async def score_lead_info():
    """Get information about the lead scoring endpoint"""
    return {
        "endpoint": "/api/ai/lead/score",
        "method": "POST",
        "description": "Score a lead based on provided data",
        "content_type": "application/json",
        "example_request": {
            "behavioral_data": {
                "page_views": 10,
                "time_on_site": 300,
                "downloads": 2,
                "email_opens": 5,
                "email_clicks": 3
            },
            "form_fields": [
                {"field_name": "company_size", "field_value": "100-500"},
                {"field_name": "industry", "field_value": "technology"}
            ],
            "history_interactions": [
                {"interaction_type": "email", "interaction_date": "2024-01-15", "interaction_value": "opened"}
            ]
        },
        "response_format": {
            "data": {
                "score": "float (0-1)",
                "confidence": "float (0-1)",
                "category": "string (hot/warm/cold)",
                "top_features": "array of strings"
            },
            "error": "string or null"
        }
    }

@app.post("/api/ai/lead/score", response_model=LeadScoreResponse)
async def score_lead(request: LeadScoreRequest):
    """Score a lead based on provided data"""
    try:
        result = await scoring_service.score_lead(request)
        return LeadScoreResponse(
            data=result,
            error=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)