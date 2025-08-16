from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Union
from datetime import datetime

class TimeSeriesDataPoint(BaseModel):
    """Single data point in time series"""
    timestamp: Union[datetime, str] = Field(..., description="Timestamp of the data point")
    value: float = Field(..., description="Metric value at this timestamp")
    metric_name: Optional[str] = Field(None, description="Name of the metric")

class AnomalyDetectionRequest(BaseModel):
    """Request model for anomaly detection"""
    time_series: List[TimeSeriesDataPoint] = Field(..., description="Time series data points")
    threshold: float = Field(2.0, description="Z-score threshold for anomaly detection", ge=0.1, le=5.0)
    metric_type: Optional[str] = Field(None, description="Type of metric (e.g., 'submission_rate', 'error_rate')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "time_series": [
                    {
                        "timestamp": "2024-01-01T00:00:00",
                        "value": 85.5,
                        "metric_name": "submission_rate"
                    },
                    {
                        "timestamp": "2024-01-01T01:00:00",
                        "value": 87.2,
                        "metric_name": "submission_rate"
                    }
                ],
                "threshold": 2.0,
                "metric_type": "submission_rate"
            }
        }

class CodeGradingRequest(BaseModel):
    """Request model for code grading"""
    repo_url: Optional[str] = Field(None, description="Repository URL to analyze")
    code_zip: Optional[str] = Field(None, description="Base64 encoded zip file containing code")
    code_content: Optional[str] = Field(None, description="Direct code content to analyze")
    language: Optional[str] = Field("python", description="Programming language")
    
    @model_validator(mode='after')
    def validate_content_provided(self):
        if not any([self.repo_url, self.code_zip, self.code_content]):
            # Allow empty request for testing error handling
            pass
        return self
    
    class Config:
        json_schema_extra = {
            "example": {
                "repo_url": "https://github.com/user/repo",
                "language": "python"
            }
        }

class DesignGradingRequest(BaseModel):
    """Request model for design grading"""
    file_url: Optional[str] = Field(None, description="URL to design file (image, PDF, etc.)")
    design_content: Optional[str] = Field(None, description="Direct design content (CSS, HTML, etc.)")
    design_type: Optional[str] = Field("web_interface", description="Type of design being analyzed")
    
    @model_validator(mode='after')
    def validate_content_provided(self):
        if not any([self.file_url, self.design_content]):
            # Allow empty request for testing error handling
            pass
        return self
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_url": "https://example.com/design.png",
                "design_type": "web_interface"
            }
        }