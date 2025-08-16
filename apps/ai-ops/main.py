from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
from datetime import datetime
from contextlib import asynccontextmanager

# Import models
from models.requests import AnomalyDetectionRequest, CodeGradingRequest, DesignGradingRequest
from models.responses import AnomalyDetectionResponse, GradingResponse

# Import services
from services.anomaly_detector import AnomalyDetector
from services.code_grader import CodeGrader
from services.design_grader import DesignGrader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
anomaly_detector = None
code_grader = None
design_grader = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    global anomaly_detector, code_grader, design_grader
    
    # Startup
    logger.info("AI Ops Service starting up...")
    anomaly_detector = AnomalyDetector()
    code_grader = CodeGrader()
    design_grader = DesignGrader()
    logger.info("Anomaly Detector, Code Grader and Design Grader services initialized")
    logger.info("Application startup complete.")
    
    yield
    
    # Shutdown
    logger.info("AI Ops Service shutting down...")

# Create FastAPI app
app = FastAPI(
    title="AI Ops Service",
    description="AI Service for Anomaly Detection & Code/Design Scoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Initialize services
anomaly_detector = AnomalyDetector()
code_grader = CodeGrader()
design_grader = DesignGrader()

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
        "service": "AI Ops Service",
        "version": "1.0.0",
        "description": "Anomaly Detection & Code/Design Scoring",
        "status": "running",
        "endpoints": {
            "anomaly_detection": "/api/ai/ops/anomaly",
            "code_grading": "/api/ai/ops/code/grade",
            "design_grading": "/api/ai/ops/design/grade",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-ops",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/ai/ops/anomaly", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect anomalies in time series KPI data using z-score analysis
    
    Input: Time series data with timestamps and values
    Output: List of anomalies with timestamps, metrics, and z-scores
    """
    try:
        logger.info("Processing anomaly detection request")
        
        # Use the anomaly detector service
        result = anomaly_detector.detect_anomalies(request)
        
        logger.info(f"Anomaly detection completed: {result.anomaly_count} anomalies found")
        return result
        
    except Exception as e:
        logger.error(f"Error in anomaly detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/ops/code/grade", response_model=GradingResponse)
async def grade_code(request: CodeGradingRequest):
    """
    Grade code quality using rule-based analysis and complexity estimation
    
    Input: Repository URL or code content
    Output: AI score and detailed reasons
    """
    try:
        logger.info("Processing code grading request")
        
        # Use the code grader service
        result = code_grader.grade_code(request)
        
        logger.info(f"Code grading completed with score: {result.ai_score}")
        return result
        
    except Exception as e:
        logger.error(f"Error in code grading: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/ops/design/grade", response_model=GradingResponse)
async def grade_design(request: DesignGradingRequest):
    """
    Grade design quality using heuristic analysis
    
    Input: Design file URL or content
    Output: AI score and detailed reasons based on alignment, contrast, consistency
    """
    try:
        logger.info("Processing design grading request")
        
        # Use the design grader service
        result = design_grader.grade_design(request)
        
        logger.info(f"Design grading completed with score: {result.ai_score}")
        return result
        
    except Exception as e:
        logger.error(f"Error in design grading: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/ops/info")
async def service_info():
    """Get service information and capabilities"""
    return {
        "service_name": "AI Ops Service",
        "version": "1.0.0",
        "description": "AI Service for Anomaly Detection & Code/Design Scoring",
        "capabilities": [
            "anomaly_detection",
            "code_grading", 
            "design_grading"
        ],
        "endpoints": {
            "anomaly_detection": "/api/ai/ops/anomaly",
            "code_grading": "/api/ai/ops/code/grade",
            "design_grading": "/api/ai/ops/design/grade"
        }
    }

@app.get("/api/ai/ops/anomaly")
async def anomaly_detection_info():
    """Get information about anomaly detection endpoint"""
    return {
        "endpoint": "/api/ai/ops/anomaly",
        "method": "POST",
        "description": "Detect anomalies in time series KPI data using z-score analysis",
        "input": {
            "time_series": "List of time series data points with timestamp and value",
            "threshold": "Z-score threshold for anomaly detection (default: 2.0)"
        },
        "output": {
            "anomalies": "List of detected anomalies with timestamp, metric, and z-score"
        }
    }

@app.get("/api/ai/ops/code/grade")
async def code_grading_info():
    """Get information about code grading endpoint"""
    return {
        "endpoint": "/api/ai/ops/code/grade",
        "method": "POST",
        "description": "Grade code quality using rule-based analysis and complexity estimation",
        "input": {
            "repo_url": "Optional repository URL",
            "code_zip": "Optional base64 encoded zip file",
            "code_content": "Optional direct code content"
        },
        "output": {
            "ai_score": "Numerical score (0-100)",
            "reasons": "List of reasons for the score"
        }
    }

@app.get("/api/ai/ops/design/grade")
async def design_grading_info():
    """Get information about design grading endpoint"""
    return {
        "endpoint": "/api/ai/ops/design/grade",
        "method": "POST",
        "description": "Grade design quality using heuristics (alignment, contrast, consistency)",
        "input": {
            "file_url": "Optional design file URL",
            "file_content": "Optional base64 encoded file content"
        },
        "output": {
            "ai_score": "Numerical score (0-100)",
            "reasons": "List of reasons for the score"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)