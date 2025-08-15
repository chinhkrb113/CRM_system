import logging
import re
import ast
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse

from models.requests import CodeGradingRequest
from models.responses import GradingResponse, GradingReason

class CodeGrader:
    """Service for grading code quality using rule-based analysis and complexity estimation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("CodeGrader initialized")
        
        # Define scoring rules
        self.scoring_rules = {
            "docstring_present": {"score": 10, "category": "documentation"},
            "type_hints_used": {"score": 15, "category": "best_practices"},
            "proper_naming": {"score": 10, "category": "readability"},
            "no_magic_numbers": {"score": 8, "category": "maintainability"},
            "error_handling": {"score": 12, "category": "robustness"},
            "code_comments": {"score": 8, "category": "documentation"},
            "function_length": {"score": -5, "category": "complexity"},  # penalty for long functions
            "cyclomatic_complexity": {"score": -2, "category": "complexity"},  # penalty per complexity point
            "duplicate_code": {"score": -10, "category": "maintainability"},
            "security_issues": {"score": -20, "category": "security"}
        }
    
    def grade_code(self, request: CodeGradingRequest) -> GradingResponse:
        """Grade code quality and return score with detailed reasons"""
        try:
            # Check if any content is provided
            if not any([request.repo_url, request.code_zip, request.code_content]):
                return GradingResponse(
                    ai_score=0.0,
                    reasons=[
                        GradingReason(
                            category="input_error",
                            description="No code content provided",
                            impact="negative",
                            score_contribution=-100.0
                        )
                    ],
                    analysis_summary="Failed to retrieve code content",
                    recommendations=["Provide valid code content or repository URL"]
                )
            
            # Get code content
            code_content = self._get_code_content(request)
            
            if not code_content:
                return GradingResponse(
                    ai_score=0.0,
                    reasons=[
                        GradingReason(
                            category="input_error",
                            description="No code content found to analyze",
                            impact="negative",
                            score_contribution=-100.0
                        )
                    ],
                    analysis_summary="Failed to retrieve code content",
                    recommendations=["Provide valid code content or repository URL"]
                )
            
            # Analyze code
            analysis_results = self._analyze_code(code_content)
            
            # Calculate score and generate reasons
            score, reasons = self._calculate_score(analysis_results)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(analysis_results)
            
            # Prepare metadata
            metadata = {
                "language": self._detect_language(code_content),
                "lines_of_code": len(code_content.split('\n')),
                "analysis_time_ms": 150,  # Simulated analysis time
                "functions_analyzed": analysis_results.get("function_count", 0),
                "classes_analyzed": analysis_results.get("class_count", 0)
            }
            
            response = GradingResponse(
                ai_score=max(0.0, min(100.0, score)),  # Clamp between 0-100
                reasons=reasons,
                analysis_summary=self._generate_summary(analysis_results, score),
                recommendations=recommendations,
                metadata=metadata
            )
            
            self.logger.info(f"Code grading completed with score: {score}")
            return response
            
        except Exception as e:
            self.logger.error(f"Error in code grading: {str(e)}")
            return GradingResponse(
                ai_score=0.0,
                reasons=[
                    GradingReason(
                        category="analysis_error",
                        description=f"Error during code analysis: {str(e)}",
                        impact="negative",
                        score_contribution=-100.0
                    )
                ],
                analysis_summary="Analysis failed due to error",
                recommendations=["Check code format and try again"]
            )
    
    def _get_code_content(self, request: CodeGradingRequest) -> Optional[str]:
        """Extract code content from request"""
        if request.code_content:
            return request.code_content
        
        if request.repo_url:
            # Simulate repository analysis (in real implementation, would clone and analyze)
            self.logger.info(f"Simulating analysis of repository: {request.repo_url}")
            return self._simulate_repo_analysis(request.repo_url)
        
        if request.code_zip:
            # Simulate ZIP file analysis
            self.logger.info("Simulating analysis of ZIP file")
            return self._simulate_zip_analysis()
        
        return None
    
    def _simulate_repo_analysis(self, repo_url: str) -> str:
        """Simulate repository analysis (stub implementation)"""
        # This is a stub - in real implementation would clone repo and analyze
        return '''
def calculate_fibonacci(n):
    """Calculate fibonacci number recursively"""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

class DataProcessor:
    def __init__(self, data: List[int]):
        self.data = data
    
    def process(self):
        # Process the data
        result = []
        for item in self.data:
            if item > 0:
                result.append(item * 2)
        return result
'''
    
    def _simulate_zip_analysis(self) -> str:
        """Simulate ZIP file analysis (stub implementation)"""
        # This is a stub - in real implementation would extract and analyze ZIP
        return '''
import os
import sys

def main():
    x = 10  # Magic number
    y = 20  # Another magic number
    
    if x > y:
        print("x is greater")
    else:
        print("y is greater")
    
    # No error handling
    result = x / y
    return result

if __name__ == "__main__":
    main()
'''
    
    def _analyze_code(self, code_content: str) -> Dict[str, Any]:
        """Analyze code content and return analysis results"""
        results = {
            "has_docstrings": self._check_docstrings(code_content),
            "has_type_hints": self._check_type_hints(code_content),
            "proper_naming": self._check_naming_conventions(code_content),
            "magic_numbers": self._check_magic_numbers(code_content),
            "error_handling": self._check_error_handling(code_content),
            "has_comments": self._check_comments(code_content),
            "function_lengths": self._analyze_function_lengths(code_content),
            "cyclomatic_complexity": self._estimate_complexity(code_content),
            "duplicate_code": self._check_duplicate_code(code_content),
            "security_issues": self._check_security_issues(code_content),
            "function_count": self._count_functions(code_content),
            "class_count": self._count_classes(code_content)
        }
        return results
    
    def _check_docstrings(self, code: str) -> bool:
        """Check if code has docstrings"""
        return '"""' in code or "'''" in code
    
    def _check_type_hints(self, code: str) -> bool:
        """Check if code uses type hints"""
        return '->' in code or ': ' in code and any(hint in code for hint in ['int', 'str', 'float', 'bool', 'List', 'Dict'])
    
    def _check_naming_conventions(self, code: str) -> bool:
        """Check if code follows proper naming conventions"""
        # Simple check for snake_case functions and variables
        function_pattern = r'def\s+([a-z_][a-z0-9_]*)\s*\('
        functions = re.findall(function_pattern, code)
        return len(functions) > 0 and all('_' in func or func.islower() for func in functions)
    
    def _check_magic_numbers(self, code: str) -> List[int]:
        """Find magic numbers in code"""
        # Simple regex to find numeric literals (excluding 0, 1)
        numbers = re.findall(r'\b([2-9]\d*)\b', code)
        return [int(n) for n in numbers]
    
    def _check_error_handling(self, code: str) -> bool:
        """Check if code has error handling"""
        return 'try:' in code or 'except' in code or 'raise' in code
    
    def _check_comments(self, code: str) -> bool:
        """Check if code has comments"""
        return '#' in code
    
    def _analyze_function_lengths(self, code: str) -> List[int]:
        """Analyze function lengths"""
        try:
            tree = ast.parse(code)
            lengths = []
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Estimate function length by line span
                    if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                        length = node.end_lineno - node.lineno + 1
                        lengths.append(length)
            return lengths
        except:
            # Fallback: count lines between def and next def/class/end
            lines = code.split('\n')
            lengths = []
            in_function = False
            current_length = 0
            
            for line in lines:
                if line.strip().startswith('def '):
                    if in_function:
                        lengths.append(current_length)
                    in_function = True
                    current_length = 1
                elif in_function:
                    if line.strip().startswith(('def ', 'class ')) or (line.strip() and not line.startswith(' ')):
                        lengths.append(current_length)
                        in_function = False
                        current_length = 0
                    else:
                        current_length += 1
            
            if in_function:
                lengths.append(current_length)
            
            return lengths
    
    def _estimate_complexity(self, code: str) -> int:
        """Estimate cyclomatic complexity"""
        # Simple estimation based on control flow keywords
        complexity_keywords = ['if', 'elif', 'for', 'while', 'except', 'and', 'or']
        complexity = 1  # Base complexity
        
        for keyword in complexity_keywords:
            complexity += code.count(keyword)
        
        return complexity
    
    def _check_duplicate_code(self, code: str) -> bool:
        """Check for duplicate code patterns"""
        lines = [line.strip() for line in code.split('\n') if line.strip()]
        unique_lines = set(lines)
        return len(lines) != len(unique_lines)
    
    def _check_security_issues(self, code: str) -> List[str]:
        """Check for potential security issues"""
        issues = []
        security_patterns = {
            'eval(': 'Use of eval() function',
            'exec(': 'Use of exec() function',
            'os.system(': 'Use of os.system()',
            'subprocess.call(': 'Use of subprocess without shell=False',
            'pickle.loads(': 'Use of pickle.loads() without validation'
        }
        
        for pattern, description in security_patterns.items():
            if pattern in code:
                issues.append(description)
        
        return issues
    
    def _count_functions(self, code: str) -> int:
        """Count number of functions"""
        return len(re.findall(r'def\s+\w+\s*\(', code))
    
    def _count_classes(self, code: str) -> int:
        """Count number of classes"""
        return len(re.findall(r'class\s+\w+\s*[\(:]', code))
    
    def _detect_language(self, code: str) -> str:
        """Detect programming language"""
        if 'def ' in code and 'import ' in code:
            return 'python'
        elif 'function ' in code and 'var ' in code:
            return 'javascript'
        elif 'public class' in code:
            return 'java'
        else:
            return 'unknown'
    
    def _calculate_score(self, analysis: Dict[str, Any]) -> tuple[float, List[GradingReason]]:
        """Calculate final score and generate reasons"""
        base_score = 60.0  # Starting score
        reasons = []
        
        # Positive scoring
        if analysis['has_docstrings']:
            base_score += self.scoring_rules['docstring_present']['score']
            reasons.append(GradingReason(
                category="documentation",
                description="Code includes docstrings for documentation",
                impact="positive",
                score_contribution=self.scoring_rules['docstring_present']['score']
            ))
        
        if analysis['has_type_hints']:
            base_score += self.scoring_rules['type_hints_used']['score']
            reasons.append(GradingReason(
                category="best_practices",
                description="Code uses type hints for better readability",
                impact="positive",
                score_contribution=self.scoring_rules['type_hints_used']['score']
            ))
        
        if analysis['proper_naming']:
            base_score += self.scoring_rules['proper_naming']['score']
            reasons.append(GradingReason(
                category="readability",
                description="Code follows proper naming conventions",
                impact="positive",
                score_contribution=self.scoring_rules['proper_naming']['score']
            ))
        
        if analysis['error_handling']:
            base_score += self.scoring_rules['error_handling']['score']
            reasons.append(GradingReason(
                category="robustness",
                description="Code includes error handling mechanisms",
                impact="positive",
                score_contribution=self.scoring_rules['error_handling']['score']
            ))
        
        if analysis['has_comments']:
            base_score += self.scoring_rules['code_comments']['score']
            reasons.append(GradingReason(
                category="documentation",
                description="Code includes helpful comments",
                impact="positive",
                score_contribution=self.scoring_rules['code_comments']['score']
            ))
        
        # Negative scoring
        magic_numbers = analysis['magic_numbers']
        if magic_numbers:
            penalty = len(magic_numbers) * 3
            base_score -= penalty
            reasons.append(GradingReason(
                category="maintainability",
                description=f"Code contains {len(magic_numbers)} magic numbers: {magic_numbers[:3]}",
                impact="negative",
                score_contribution=-penalty
            ))
        
        # Function length penalties
        long_functions = [l for l in analysis['function_lengths'] if l > 20]
        if long_functions:
            penalty = len(long_functions) * 5
            base_score -= penalty
            reasons.append(GradingReason(
                category="complexity",
                description=f"Found {len(long_functions)} functions longer than 20 lines",
                impact="negative",
                score_contribution=-penalty
            ))
        
        # Complexity penalty
        complexity = analysis['cyclomatic_complexity']
        if complexity > 10:
            penalty = (complexity - 10) * 2
            base_score -= penalty
            reasons.append(GradingReason(
                category="complexity",
                description=f"High cyclomatic complexity: {complexity}",
                impact="negative",
                score_contribution=-penalty
            ))
        
        # Security issues
        security_issues = analysis['security_issues']
        if security_issues:
            penalty = len(security_issues) * 20
            base_score -= penalty
            reasons.append(GradingReason(
                category="security",
                description=f"Security issues found: {', '.join(security_issues[:2])}",
                impact="negative",
                score_contribution=-penalty
            ))
        
        return base_score, reasons
    
    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        if not analysis['has_docstrings']:
            recommendations.append("Add docstrings to functions and classes for better documentation")
        
        if not analysis['has_type_hints']:
            recommendations.append("Consider adding type hints to improve code readability")
        
        if not analysis['error_handling']:
            recommendations.append("Add error handling with try-except blocks")
        
        if analysis['magic_numbers']:
            recommendations.append("Replace magic numbers with named constants")
        
        if any(l > 20 for l in analysis['function_lengths']):
            recommendations.append("Break down long functions into smaller, more focused functions")
        
        if analysis['cyclomatic_complexity'] > 10:
            recommendations.append("Reduce complexity by simplifying conditional logic")
        
        if analysis['security_issues']:
            recommendations.append("Address security vulnerabilities in the code")
        
        return recommendations
    
    def _generate_summary(self, analysis: Dict[str, Any], score: float) -> str:
        """Generate analysis summary"""
        if score >= 80:
            return "Excellent code quality with good practices and minimal issues"
        elif score >= 60:
            return "Good code quality with some areas for improvement"
        elif score >= 40:
            return "Moderate code quality with several issues to address"
        else:
            return "Poor code quality requiring significant improvements"