from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

class AnomalyPoint(BaseModel):
    """Single anomaly detection result"""
    timestamp: Union[datetime, str] = Field(..., description="Timestamp of the anomaly")
    metric: str = Field(..., description="Name of the metric")
    value: float = Field(..., description="Actual value at this timestamp")
    zscore: float = Field(..., description="Z-score indicating anomaly severity")
    expected_range: Optional[dict] = Field(None, description="Expected value range")
    
    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2024-01-01T02:00:00",
                "metric": "submission_rate",
                "value": 45.2,
                "zscore": -2.8,
                "expected_range": {"min": 80.0, "max": 90.0}
            }
        }

class AnomalyDetectionResponse(BaseModel):
    """Response model for anomaly detection"""
    anomalies: List[AnomalyPoint] = Field(..., description="List of detected anomalies")
    total_points: int = Field(..., description="Total number of data points analyzed")
    anomaly_count: int = Field(..., description="Number of anomalies detected")
    threshold_used: float = Field(..., description="Z-score threshold used for detection")
    statistics: Optional[dict] = Field(None, description="Statistical summary of the data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "anomalies": [
                    {
                        "timestamp": "2024-01-01T02:00:00",
                        "metric": "submission_rate",
                        "value": 45.2,
                        "zscore": -2.8,
                        "expected_range": {"min": 80.0, "max": 90.0}
                    }
                ],
                "total_points": 24,
                "anomaly_count": 1,
                "threshold_used": 2.0,
                "statistics": {
                    "mean": 85.5,
                    "std": 3.2,
                    "min": 45.2,
                    "max": 92.1
                }
            }
        }

class GradingReason(BaseModel):
    """Single reason for grading score"""
    category: str = Field(..., description="Category of the reason")
    description: str = Field(..., description="Detailed description")
    impact: str = Field(..., description="Impact level (positive/negative/neutral)")
    score_contribution: float = Field(..., description="Points contributed to final score")
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "code_complexity",
                "description": "Function has high cyclomatic complexity (15)",
                "impact": "negative",
                "score_contribution": -10.0
            }
        }

class GradingResponse(BaseModel):
    """Response model for code and design grading"""
    ai_score: float = Field(..., description="Overall AI score (0-100)", ge=0, le=100)
    reasons: List[GradingReason] = Field(..., description="List of reasons for the score")
    analysis_summary: Optional[str] = Field(None, description="Summary of the analysis")
    recommendations: Optional[List[str]] = Field(None, description="Improvement recommendations")
    metadata: Optional[dict] = Field(None, description="Additional metadata about the analysis")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ai_score": 75.5,
                "reasons": [
                    {
                        "category": "code_complexity",
                        "description": "Function has moderate cyclomatic complexity (8)",
                        "impact": "neutral",
                        "score_contribution": 0.0
                    },
                    {
                        "category": "best_practices",
                        "description": "Good use of docstrings and type hints",
                        "impact": "positive",
                        "score_contribution": 15.0
                    }
                ],
                "analysis_summary": "Code shows good practices with room for optimization",
                "recommendations": [
                    "Consider adding error handling",
                    "Optimize recursive function for better performance"
                ],
                "metadata": {
                    "language": "python",
                    "lines_of_code": 25,
                    "analysis_time_ms": 150
                }
            }
        }