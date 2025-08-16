import logging
import statistics
from typing import List, Dict, Any
from datetime import datetime
import math

from models.requests import AnomalyDetectionRequest, TimeSeriesDataPoint
from models.responses import AnomalyDetectionResponse, AnomalyPoint

class AnomalyDetector:
    """Service for detecting anomalies in time series data using z-score analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("AnomalyDetector initialized")
    
    def detect_anomalies(self, request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
        """Detect anomalies in time series data using z-score analysis"""
        try:
            # Extract values from time series
            values = [point.value for point in request.time_series]
            
            if len(values) < 3:
                self.logger.warning("Insufficient data points for anomaly detection")
                return AnomalyDetectionResponse(
                    anomalies=[],
                    total_points=len(values),
                    anomaly_count=0,
                    threshold_used=request.threshold,
                    statistics=self._calculate_statistics(values) if values else None
                )
            
            # Calculate statistics
            mean_val = statistics.mean(values)
            std_val = statistics.stdev(values) if len(values) > 1 else 0
            
            if std_val == 0:
                self.logger.info("No variation in data, no anomalies detected")
                return AnomalyDetectionResponse(
                    anomalies=[],
                    total_points=len(values),
                    anomaly_count=0,
                    threshold_used=request.threshold,
                    statistics=self._calculate_statistics(values)
                )
            
            # Detect anomalies using z-score
            anomalies = []
            for i, point in enumerate(request.time_series):
                z_score = (point.value - mean_val) / std_val
                
                if abs(z_score) > request.threshold:
                    # Determine metric name
                    metric_name = point.metric_name or request.metric_type or "unknown_metric"
                    
                    # Calculate expected range
                    expected_range = {
                        "min": mean_val - request.threshold * std_val,
                        "max": mean_val + request.threshold * std_val
                    }
                    
                    anomaly = AnomalyPoint(
                        timestamp=point.timestamp,
                        metric=metric_name,
                        value=point.value,
                        zscore=round(z_score, 3),
                        expected_range=expected_range
                    )
                    anomalies.append(anomaly)
            
            # Prepare response
            response = AnomalyDetectionResponse(
                anomalies=anomalies,
                total_points=len(request.time_series),
                anomaly_count=len(anomalies),
                threshold_used=request.threshold,
                statistics=self._calculate_statistics(values)
            )
            
            self.logger.info(f"Anomaly detection completed: {len(anomalies)} anomalies found out of {len(request.time_series)} points")
            return response
            
        except Exception as e:
            self.logger.error(f"Error in anomaly detection: {str(e)}")
            raise
    
    def _calculate_statistics(self, values: List[float]) -> Dict[str, Any]:
        """Calculate statistical summary of the data"""
        if not values:
            return {}
        
        try:
            stats = {
                "mean": round(statistics.mean(values), 3),
                "median": round(statistics.median(values), 3),
                "std": round(statistics.stdev(values), 3) if len(values) > 1 else 0,
                "min": round(min(values), 3),
                "max": round(max(values), 3),
                "count": len(values)
            }
            
            # Add quartiles if enough data
            if len(values) >= 4:
                sorted_values = sorted(values)
                n = len(sorted_values)
                stats["q1"] = round(sorted_values[n // 4], 3)
                stats["q3"] = round(sorted_values[3 * n // 4], 3)
            
            return stats
        except Exception as e:
            self.logger.error(f"Error calculating statistics: {str(e)}")
            return {"error": "Failed to calculate statistics"}
    
    def _detect_seasonal_anomalies(self, request: AnomalyDetectionRequest) -> List[AnomalyPoint]:
        """Advanced method for detecting seasonal anomalies (placeholder for future enhancement)"""
        # This is a placeholder for more sophisticated anomaly detection
        # that could consider seasonal patterns, trends, etc.
        self.logger.info("Seasonal anomaly detection not yet implemented")
        return []
    
    def _detect_trend_anomalies(self, request: AnomalyDetectionRequest) -> List[AnomalyPoint]:
        """Advanced method for detecting trend-based anomalies (placeholder for future enhancement)"""
        # This is a placeholder for trend-based anomaly detection
        self.logger.info("Trend anomaly detection not yet implemented")
        return []