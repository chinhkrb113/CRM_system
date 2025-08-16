import logging
import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import base64

from models.requests import DesignGradingRequest
from models.responses import GradingResponse, GradingReason

class DesignGrader:
    """Service for grading design quality using heuristic analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("DesignGrader initialized")
        
        # Define design scoring criteria
        self.design_criteria = {
            "alignment": {"weight": 20, "max_score": 20},
            "contrast": {"weight": 15, "max_score": 15},
            "consistency": {"weight": 25, "max_score": 25},
            "typography": {"weight": 15, "max_score": 15},
            "color_harmony": {"weight": 10, "max_score": 10},
            "spacing": {"weight": 10, "max_score": 10},
            "accessibility": {"weight": 5, "max_score": 5}
        }
    
    def grade_design(self, request: DesignGradingRequest) -> GradingResponse:
        """Grade design quality using heuristic analysis"""
        try:
            # Check if any content is provided
            if not any([request.file_url, request.design_content]):
                return GradingResponse(
                    ai_score=0.0,
                    reasons=[
                        GradingReason(
                            category="input_error",
                            description="No design content provided",
                            impact="negative",
                            score_contribution=-100.0
                        )
                    ],
                    analysis_summary="No design content to analyze",
                    recommendations=["Please provide either file_url or design_content"]
                )
            
            # Get design content/metadata
            design_data = self._get_design_data(request)
            
            if not design_data:
                return GradingResponse(
                    ai_score=0.0,
                    reasons=[
                        GradingReason(
                            category="input_error",
                            description="No design content found to analyze",
                            impact="negative",
                            score_contribution=-100.0
                        )
                    ],
                    analysis_summary="Failed to retrieve design content",
                    recommendations=["Provide valid design file URL or content"]
                )
            
            # Analyze design using heuristics
            analysis_results = self._analyze_design(design_data)
            
            # Calculate score and generate reasons
            score, reasons = self._calculate_design_score(analysis_results)
            
            # Generate recommendations
            recommendations = self._generate_design_recommendations(analysis_results)
            
            # Prepare metadata
            metadata = {
                "design_type": design_data.get("type", "unknown"),
                "dimensions": design_data.get("dimensions", "unknown"),
                "color_count": analysis_results.get("color_count", 0),
                "font_count": analysis_results.get("font_count", 0),
                "analysis_time_ms": 200  # Simulated analysis time
            }
            
            response = GradingResponse(
                ai_score=max(0.0, min(100.0, score)),
                reasons=reasons,
                analysis_summary=self._generate_design_summary(analysis_results, score),
                recommendations=recommendations,
                metadata=metadata
            )
            
            self.logger.info(f"Design grading completed with score: {score}")
            return response
            
        except Exception as e:
            self.logger.error(f"Error in design grading: {str(e)}")
            return GradingResponse(
                ai_score=0.0,
                reasons=[
                    GradingReason(
                        category="analysis_error",
                        description=f"Error during design analysis: {str(e)}",
                        impact="negative",
                        score_contribution=-100.0
                    )
                ],
                analysis_summary="Analysis failed due to error",
                recommendations=["Check design file format and try again"]
            )
    
    def _get_design_data(self, request: DesignGradingRequest) -> Optional[Dict[str, Any]]:
        """Extract design data from request"""
        if request.design_content:
            return self._parse_design_content(request.design_content)
        
        if request.file_url:
            # Simulate design file analysis
            self.logger.info(f"Simulating analysis of design file: {request.file_url}")
            return self._simulate_design_analysis(request.file_url)
        
        return None
    
    def _parse_design_content(self, content: str) -> Dict[str, Any]:
        """Parse design content (CSS, HTML, etc.)"""
        design_data = {
            "type": "web_design",
            "content": content,
            "dimensions": "responsive"
        }
        
        # Extract CSS properties if present
        if 'color:' in content or 'background-color:' in content:
            design_data["has_colors"] = True
        
        if 'font-family:' in content or 'font-size:' in content:
            design_data["has_typography"] = True
        
        if 'margin:' in content or 'padding:' in content:
            design_data["has_spacing"] = True
        
        return design_data
    
    def _simulate_design_analysis(self, file_url: str) -> Dict[str, Any]:
        """Simulate design file analysis based on URL"""
        # This is a stub - in real implementation would download and analyze the file
        file_extension = file_url.split('.')[-1].lower() if '.' in file_url else 'unknown'
        
        # Simulate different design types
        if file_extension in ['png', 'jpg', 'jpeg']:
            return {
                "type": "raster_image",
                "dimensions": "1920x1080",
                "has_colors": True,
                "has_typography": True,
                "has_spacing": True,
                "complexity": "medium",
                "content": "Mock raster image content with colors and text elements"
            }
        elif file_extension in ['svg']:
            return {
                "type": "vector_image",
                "dimensions": "scalable",
                "has_colors": True,
                "has_typography": True,
                "has_spacing": True,
                "complexity": "high",
                "content": "<svg><rect fill='blue'/><text>Sample SVG</text></svg>"
            }
        elif file_extension in ['pdf']:
            return {
                "type": "document_design",
                "dimensions": "A4",
                "has_colors": True,
                "has_typography": True,
                "has_spacing": True,
                "complexity": "medium",
                "content": "PDF with professional layout, typography and color scheme"
            }
        else:
            return {
                "type": "web_design",
                "dimensions": "responsive",
                "has_colors": True,
                "has_typography": True,
                "has_spacing": True,
                "complexity": "low",
                "content": "Web design with CSS styling and HTML structure"
            }
    
    def _analyze_design(self, design_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze design using heuristic methods"""
        results = {
            "alignment_score": self._analyze_alignment(design_data),
            "contrast_score": self._analyze_contrast(design_data),
            "consistency_score": self._analyze_consistency(design_data),
            "typography_score": self._analyze_typography(design_data),
            "color_harmony_score": self._analyze_color_harmony(design_data),
            "spacing_score": self._analyze_spacing(design_data),
            "accessibility_score": self._analyze_accessibility(design_data),
            "color_count": self._estimate_color_count(design_data),
            "font_count": self._estimate_font_count(design_data),
            "complexity_level": design_data.get("complexity", "medium")
        }
        return results
    
    def _analyze_alignment(self, design_data: Dict[str, Any]) -> float:
        """Analyze alignment quality (heuristic)"""
        # Simulate alignment analysis
        base_score = 15.0
        
        design_type = design_data.get("type", "unknown")
        
        if design_type == "vector_image":
            # Vector images typically have better alignment
            base_score += 3.0
        elif design_type == "web_design":
            # Web designs with CSS likely have structured alignment
            if design_data.get("has_spacing"):
                base_score += 2.0
        
        # Add some randomness to simulate real analysis
        import random
        random.seed(hash(str(design_data)) % 1000)
        variation = random.uniform(-2.0, 2.0)
        
        return max(0.0, min(20.0, base_score + variation))
    
    def _analyze_contrast(self, design_data: Dict[str, Any]) -> float:
        """Analyze contrast quality (heuristic)"""
        base_score = 12.0
        
        if design_data.get("has_colors"):
            base_score += 2.0
        
        # Simulate contrast analysis based on design type
        design_type = design_data.get("type", "unknown")
        if design_type in ["raster_image", "vector_image"]:
            base_score += 1.0
        
        import random
        random.seed(hash(str(design_data)) % 2000)
        variation = random.uniform(-1.5, 1.5)
        
        return max(0.0, min(15.0, base_score + variation))
    
    def _analyze_consistency(self, design_data: Dict[str, Any]) -> float:
        """Analyze consistency quality (heuristic)"""
        base_score = 20.0
        
        # Consistency is often better in structured designs
        if design_data.get("type") == "web_design":
            if design_data.get("has_typography") and design_data.get("has_spacing"):
                base_score += 3.0
        
        complexity = design_data.get("complexity", "medium")
        if complexity == "high":
            base_score -= 2.0  # Higher complexity can reduce consistency
        elif complexity == "low":
            base_score += 1.0  # Lower complexity often means better consistency
        
        import random
        random.seed(hash(str(design_data)) % 3000)
        variation = random.uniform(-3.0, 2.0)
        
        return max(0.0, min(25.0, base_score + variation))
    
    def _analyze_typography(self, design_data: Dict[str, Any]) -> float:
        """Analyze typography quality (heuristic)"""
        base_score = 10.0
        
        if design_data.get("has_typography"):
            base_score += 3.0
        
        # Document designs typically have better typography
        if design_data.get("type") == "document_design":
            base_score += 2.0
        
        import random
        random.seed(hash(str(design_data)) % 4000)
        variation = random.uniform(-2.0, 2.0)
        
        return max(0.0, min(15.0, base_score + variation))
    
    def _analyze_color_harmony(self, design_data: Dict[str, Any]) -> float:
        """Analyze color harmony (heuristic)"""
        base_score = 7.0
        
        if design_data.get("has_colors"):
            base_score += 2.0
        
        # Vector images often have better color harmony
        if design_data.get("type") == "vector_image":
            base_score += 1.0
        
        import random
        random.seed(hash(str(design_data)) % 5000)
        variation = random.uniform(-1.0, 1.0)
        
        return max(0.0, min(10.0, base_score + variation))
    
    def _analyze_spacing(self, design_data: Dict[str, Any]) -> float:
        """Analyze spacing quality (heuristic)"""
        base_score = 7.0
        
        if design_data.get("has_spacing"):
            base_score += 2.0
        
        # Web designs with CSS typically have better spacing control
        if design_data.get("type") == "web_design":
            base_score += 1.0
        
        import random
        random.seed(hash(str(design_data)) % 6000)
        variation = random.uniform(-1.0, 1.0)
        
        return max(0.0, min(10.0, base_score + variation))
    
    def _analyze_accessibility(self, design_data: Dict[str, Any]) -> float:
        """Analyze accessibility (heuristic)"""
        base_score = 3.0
        
        # Web designs are more likely to consider accessibility
        if design_data.get("type") == "web_design":
            base_score += 1.5
        
        import random
        random.seed(hash(str(design_data)) % 7000)
        variation = random.uniform(-0.5, 0.5)
        
        return max(0.0, min(5.0, base_score + variation))
    
    def _estimate_color_count(self, design_data: Dict[str, Any]) -> int:
        """Estimate number of colors used"""
        if not design_data.get("has_colors"):
            return 1  # Monochrome
        
        complexity = design_data.get("complexity", "medium")
        if complexity == "high":
            return 8
        elif complexity == "medium":
            return 5
        else:
            return 3
    
    def _estimate_font_count(self, design_data: Dict[str, Any]) -> int:
        """Estimate number of fonts used"""
        if not design_data.get("has_typography"):
            return 0
        
        design_type = design_data.get("type", "unknown")
        if design_type == "document_design":
            return 2  # Usually title and body fonts
        elif design_type == "web_design":
            return 3  # More variety in web designs
        else:
            return 1  # Images typically use fewer fonts
    
    def _calculate_design_score(self, analysis: Dict[str, Any]) -> tuple[float, List[GradingReason]]:
        """Calculate final design score and generate reasons"""
        total_score = 0.0
        reasons = []
        
        # Calculate weighted scores for each criterion
        for criterion, config in self.design_criteria.items():
            score_key = f"{criterion}_score"
            if score_key in analysis:
                criterion_score = analysis[score_key]
                weighted_score = criterion_score * (config["weight"] / config["max_score"])
                total_score += weighted_score
                
                # Generate reason based on score
                if criterion_score >= config["max_score"] * 0.8:
                    impact = "positive"
                    description = f"Excellent {criterion.replace('_', ' ')}"
                elif criterion_score >= config["max_score"] * 0.6:
                    impact = "neutral"
                    description = f"Good {criterion.replace('_', ' ')}"
                else:
                    impact = "negative"
                    description = f"Poor {criterion.replace('_', ' ')} needs improvement"
                
                reasons.append(GradingReason(
                    category=criterion,
                    description=description,
                    impact=impact,
                    score_contribution=round(weighted_score, 1)
                ))
        
        return total_score, reasons
    
    def _generate_design_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate design improvement recommendations"""
        recommendations = []
        
        if analysis.get("alignment_score", 0) < 15:
            recommendations.append("Improve element alignment using grids or guides")
        
        if analysis.get("contrast_score", 0) < 10:
            recommendations.append("Increase contrast between text and background for better readability")
        
        if analysis.get("consistency_score", 0) < 18:
            recommendations.append("Maintain consistent spacing, colors, and typography throughout")
        
        if analysis.get("typography_score", 0) < 10:
            recommendations.append("Improve typography hierarchy and font choices")
        
        if analysis.get("color_harmony_score", 0) < 7:
            recommendations.append("Use a cohesive color palette with better harmony")
        
        if analysis.get("spacing_score", 0) < 7:
            recommendations.append("Improve spacing between elements for better visual hierarchy")
        
        if analysis.get("accessibility_score", 0) < 3:
            recommendations.append("Consider accessibility guidelines for color contrast and text size")
        
        # Add general recommendations based on color and font count
        color_count = analysis.get("color_count", 0)
        if color_count > 6:
            recommendations.append("Consider reducing the number of colors for a cleaner look")
        
        font_count = analysis.get("font_count", 0)
        if font_count > 3:
            recommendations.append("Limit the number of fonts to maintain consistency")
        
        return recommendations
    
    def _generate_design_summary(self, analysis: Dict[str, Any], score: float) -> str:
        """Generate design analysis summary"""
        if score >= 80:
            return "Excellent design quality with strong visual hierarchy and consistency"
        elif score >= 65:
            return "Good design quality with minor areas for improvement"
        elif score >= 50:
            return "Moderate design quality with several areas needing attention"
        elif score >= 35:
            return "Below average design quality requiring significant improvements"
        else:
            return "Poor design quality needing major redesign considerations"