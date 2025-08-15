import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

from main import app

# Create test client
client = TestClient(app)

class TestAIOpsService:
    """Test suite for AI Ops Service endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert data["service"] == "AI Ops Service"
        assert "status" in data
        assert data["status"] == "running"
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "service" in data
    
    def test_info_endpoint(self):
        """Test service info endpoint"""
        response = client.get("/api/ai/ops/info")
        assert response.status_code == 200
        data = response.json()
        assert "service_name" in data
        assert "version" in data
        assert "capabilities" in data
        assert len(data["capabilities"]) == 3
    
    def test_anomaly_detection_basic(self):
        """Test basic anomaly detection"""
        payload = {
            "time_series": [
                {
                    "timestamp": "2024-01-01T00:00:00Z",
                    "value": 85.0,
                    "metric_name": "cpu_usage"
                },
                {
                    "timestamp": "2024-01-01T01:00:00Z",
                    "value": 87.0,
                    "metric_name": "cpu_usage"
                },
                {
                    "timestamp": "2024-01-01T02:00:00Z",
                    "value": 45.0,
                    "metric_name": "cpu_usage"
                },
                {
                    "timestamp": "2024-01-01T03:00:00Z",
                    "value": 86.0,
                    "metric_name": "cpu_usage"
                }
            ],
            "threshold": 2.0,
            "metric_type": "cpu_usage"
        }
        
        response = client.post("/api/ai/ops/anomaly", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "anomalies" in data
        assert "total_points" in data
        assert "anomaly_count" in data
        assert "threshold_used" in data
        assert "statistics" in data
        
        assert data["total_points"] == 4
        assert data["threshold_used"] == 2.0
        assert isinstance(data["anomalies"], list)
    
    def test_anomaly_detection_no_anomalies(self):
        """Test anomaly detection with no anomalies"""
        payload = {
            "time_series": [
                {
                    "timestamp": "2024-01-01T00:00:00Z",
                    "value": 85.0,
                    "metric_name": "response_time"
                },
                {
                    "timestamp": "2024-01-01T01:00:00Z",
                    "value": 86.0,
                    "metric_name": "response_time"
                },
                {
                    "timestamp": "2024-01-01T02:00:00Z",
                    "value": 84.0,
                    "metric_name": "response_time"
                }
            ],
            "threshold": 2.0,
            "metric_type": "response_time"
        }
        
        response = client.post("/api/ai/ops/anomaly", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["anomaly_count"] == 0
        assert len(data["anomalies"]) == 0
    
    def test_anomaly_detection_insufficient_data(self):
        """Test anomaly detection with insufficient data"""
        payload = {
            "time_series": [
                {
                    "timestamp": "2024-01-01T00:00:00Z",
                    "value": 85.0,
                    "metric_name": "error_rate"
                }
            ],
            "threshold": 2.0,
            "metric_type": "error_rate"
        }
        
        response = client.post("/api/ai/ops/anomaly", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_points"] == 1
        assert data["anomaly_count"] == 0
    
    def test_code_grading_with_content(self):
        """Test code grading with direct code content"""
        code_content = '''
def fibonacci(n: int) -> int:
    """Calculate fibonacci number recursively"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class Calculator:
    """Simple calculator class"""
    
    def add(self, a: int, b: int) -> int:
        """Add two numbers"""
        return a + b
    
    def divide(self, a: int, b: int) -> float:
        """Divide two numbers with error handling"""
        try:
            return a / b
        except ZeroDivisionError:
            raise ValueError("Cannot divide by zero")
'''
        
        payload = {
            "code_content": code_content,
            "language": "python"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert "reasons" in data
        assert "analysis_summary" in data
        assert "recommendations" in data
        assert "metadata" in data
        
        assert 0 <= data["ai_score"] <= 100
        assert isinstance(data["reasons"], list)
        assert len(data["reasons"]) > 0
        
        # Check reason structure
        for reason in data["reasons"]:
            assert "category" in reason
            assert "description" in reason
            assert "impact" in reason
            assert "score_contribution" in reason
    
    def test_code_grading_with_repo_url(self):
        """Test code grading with repository URL"""
        payload = {
            "repo_url": "https://github.com/example/sample-repo",
            "language": "python"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert "reasons" in data
        assert 0 <= data["ai_score"] <= 100
    
    def test_code_grading_with_zip(self):
        """Test code grading with ZIP file"""
        payload = {
            "code_zip": "base64encodedcontent",
            "language": "python"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert "reasons" in data
    
    def test_code_grading_no_content(self):
        """Test code grading with no content provided"""
        payload = {
            "language": "python"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["ai_score"] == 0.0
        assert len(data["reasons"]) > 0
        assert data["reasons"][0]["category"] == "input_error"
    
    def test_design_grading_with_url(self):
        """Test design grading with file URL"""
        payload = {
            "file_url": "https://example.com/design.png",
            "design_type": "web_interface"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert "reasons" in data
        assert "analysis_summary" in data
        assert "recommendations" in data
        assert "metadata" in data
        
        assert 0 <= data["ai_score"] <= 100
        assert isinstance(data["reasons"], list)
        assert len(data["reasons"]) > 0
        
        # Check reason structure
        for reason in data["reasons"]:
            assert "category" in reason
            assert "description" in reason
            assert "impact" in reason
            assert "score_contribution" in reason
    
    def test_design_grading_with_content(self):
        """Test design grading with design content"""
        css_content = '''
.header {
    background-color: #333;
    color: white;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
}
'''
        
        payload = {
            "design_content": css_content,
            "design_type": "web_interface"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert "reasons" in data
        assert 0 <= data["ai_score"] <= 100
    
    def test_design_grading_svg_file(self):
        """Test design grading with SVG file"""
        payload = {
            "file_url": "https://example.com/logo.svg",
            "design_type": "logo"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert data["metadata"]["design_type"] == "vector_image"
    
    def test_design_grading_pdf_file(self):
        """Test design grading with PDF file"""
        payload = {
            "file_url": "https://example.com/brochure.pdf",
            "design_type": "print_material"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_score" in data
        assert data["metadata"]["design_type"] == "document_design"
    
    def test_design_grading_no_content(self):
        """Test design grading with no content provided"""
        payload = {
            "design_type": "web_interface"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["ai_score"] == 0.0
        assert len(data["reasons"]) > 0
        assert data["reasons"][0]["category"] == "input_error"
    
    def test_anomaly_detection_invalid_payload(self):
        """Test anomaly detection with invalid payload"""
        payload = {
            "invalid_field": "invalid_value"
        }
        
        response = client.post("/api/ai/ops/anomaly", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_code_grading_invalid_payload(self):
        """Test code grading with invalid payload"""
        payload = {
            "invalid_field": "invalid_value"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200  # Service handles empty request gracefully
        data = response.json()
        assert data["ai_score"] == 0.0
        assert len(data["reasons"]) > 0
        assert "input_error" in data["reasons"][0]["category"]
    
    def test_design_grading_invalid_payload(self):
        """Test design grading with invalid payload"""
        payload = {
            "invalid_field": "invalid_value"
        }
        
        response = client.post("/api/ai/ops/design/grade", json=payload)
        assert response.status_code == 200  # Service handles empty request gracefully
        data = response.json()
        assert data["ai_score"] == 0.0
        assert len(data["reasons"]) > 0
        assert "input_error" in data["reasons"][0]["category"]
    
    def test_anomaly_detection_large_dataset(self):
        """Test anomaly detection with larger dataset"""
        # Generate time series data with one clear anomaly
        time_series = []
        base_value = 100.0
        
        for i in range(50):
            value = base_value + (i % 10) - 5  # Normal variation
            if i == 25:  # Insert anomaly
                value = base_value + 50  # Clear outlier
            
            time_series.append({
                "timestamp": f"2024-01-01T{i:02d}:00:00Z",
                "value": value,
                "metric_name": "test_metric"
            })
        
        payload = {
            "time_series": time_series,
            "threshold": 2.0,
            "metric_type": "test_metric"
        }
        
        response = client.post("/api/ai/ops/anomaly", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_points"] == 50
        assert data["anomaly_count"] >= 1  # Should detect at least the inserted anomaly
    
    def test_code_grading_complex_code(self):
        """Test code grading with complex code sample"""
        complex_code = '''
import os
import sys
from typing import List, Dict, Optional

class DataProcessor:
    """Complex data processor with multiple methods"""
    
    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.data_cache = {}
    
    def process_data(self, data: List[Dict]) -> List[Dict]:
        """Process data with error handling and validation"""
        try:
            if not data:
                raise ValueError("Empty data provided")
            
            processed = []
            for item in data:
                if self._validate_item(item):
                    processed_item = self._transform_item(item)
                    processed.append(processed_item)
                else:
                    self._log_error(f"Invalid item: {item}")
            
            return processed
        except Exception as e:
            self._log_error(f"Processing failed: {e}")
            raise
    
    def _validate_item(self, item: Dict) -> bool:
        """Validate individual data item"""
        required_fields = ["id", "value", "timestamp"]
        return all(field in item for field in required_fields)
    
    def _transform_item(self, item: Dict) -> Dict:
        """Transform data item"""
        # Complex transformation logic
        transformed = item.copy()
        transformed["processed_at"] = self._get_timestamp()
        transformed["normalized_value"] = self._normalize_value(item["value"])
        return transformed
    
    def _normalize_value(self, value: float) -> float:
        """Normalize value using configuration"""
        min_val = float(self.config.get("min_value", 0))
        max_val = float(self.config.get("max_value", 100))
        return (value - min_val) / (max_val - min_val)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _log_error(self, message: str) -> None:
        """Log error message"""
        print(f"ERROR: {message}", file=sys.stderr)
'''
        
        payload = {
            "code_content": complex_code,
            "language": "python"
        }
        
        response = client.post("/api/ai/ops/code/grade", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["ai_score"] > 40  # Adjusted expectation for mock grading
        assert len(data["reasons"]) >= 3  # Should have multiple evaluation criteria

if __name__ == "__main__":
    pytest.main(["-v", __file__])