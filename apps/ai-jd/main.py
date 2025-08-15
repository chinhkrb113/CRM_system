from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import uvicorn
import logging
from models.jd_models import (
    JDParseRequest, JDParseResponse, 
    MatchRequest, MatchResponse
)
from services.jd_parser import JDParserService
from services.candidate_matcher import CandidateMatcherService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI JD Parsing & Matching Service",
    description="Service for parsing job descriptions and matching candidates",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
jd_parser = JDParserService()
candidate_matcher = CandidateMatcherService()

@app.on_event("startup")
async def startup_event():
    logger.info("AI JD Service starting up...")
    logger.info("JD Parser and Candidate Matcher services initialized")
    logger.info("Application startup complete.")

@app.get("/")
async def root():
    return {
        "service": "AI JD Parsing & Matching",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/",
            "/health",
            "/api/ai/jd/parse_jd",
            "/api/ai/jd/match",
            "/docs",
            "/redoc"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-jd"}

@app.post("/api/ai/jd/parse_jd", response_model=JDParseResponse)
async def parse_jd(request: JDParseRequest):
    """Parse job description to extract skills and seniority level"""
    try:
        result = jd_parser.parse_jd(request)
        return result
    except Exception as e:
        logger.error(f"Error in parse_jd endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/jd/match", response_model=MatchResponse)
async def match_candidates(request: MatchRequest):
    """Match candidates against job requirements"""
    try:
        result = candidate_matcher.match_candidates(request)
        return result
    except Exception as e:
        logger.error(f"Error in match_candidates endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/jd/parse_jd")
async def parse_jd_info():
    """Get information about the JD parsing endpoint"""
    return {
        "endpoint": "/api/ai/jd/parse_jd",
        "method": "POST",
        "description": "Parse job description to extract skills and seniority level",
        "request_format": {
            "job_description": "string (required) - Job description text to parse",
            "job_id": "string (optional) - Job ID for reference"
        },
        "response_format": {
            "skills": "array of {name: string, weight: float} - Technical skills with importance weights",
            "soft_skills": "array of strings - Soft skills",
            "seniority_hint": "string - Detected seniority level (junior/mid/senior/lead/principal)",
            "job_id": "string - Job ID if provided"
        },
        "example_request": {
            "job_description": "We are looking for a Senior Python Developer with experience in Django, PostgreSQL, and AWS. Strong communication skills required.",
            "job_id": "job_123"
        }
    }

@app.get("/api/ai/jd/match")
async def match_candidates_info():
    """Get information about the candidate matching endpoint"""
    return {
        "endpoint": "/api/ai/jd/match",
        "method": "POST",
        "description": "Match candidates against job requirements and return ranked results",
        "request_format": {
            "job_id": "string (required) - Job ID to match against",
            "candidates": "array of candidate objects",
            "top_k": "integer (optional, default=10) - Number of top matches to return",
            "weights": "object (optional) - Scoring weights for skill/eval/recency"
        },
        "candidate_format": {
            "student_id": "string - Unique student identifier",
            "skills": "object - Skills mapping {skill_name: level_0_to_5}",
            "eval_score": "float - Evaluation score (0-100)",
            "recent_projects": "array - Recent projects with technologies"
        },
        "response_format": {
            "job_id": "string - Job ID that was matched against",
            "matches": "array of ranked candidate matches with scores and reasons",
            "total_candidates": "integer - Total candidates evaluated",
            "processing_time_ms": "float - Processing time in milliseconds"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)