import logging
import time
from typing import List, Dict, Set
from datetime import datetime, timedelta
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from collections import Counter
import re
import math
from models.jd_models import (
    MatchRequest, MatchResponse, Match, MatchReasons, 
    Candidate, MatchWeights
)

logger = logging.getLogger(__name__)

class CandidateMatcherService:
    def __init__(self):
        # Note: TF-IDF vectorizer removed to avoid sklearn dependency
        # Using simple keyword matching instead
        pass
    
    def match_candidates(self, request: MatchRequest, job_skills: List[str] = None) -> MatchResponse:
        """Match candidates against job requirements"""
        start_time = time.time()
        
        try:
            # If job_skills not provided, use a default set for demo
            if job_skills is None:
                job_skills = ['python', 'machine learning', 'sql', 'communication']
            
            matches = []
            
            for candidate in request.candidates:
                match_result = self._evaluate_candidate(
                    candidate, 
                    job_skills, 
                    request.weights
                )
                matches.append(match_result)
            
            # Sort by score descending and take top_k
            matches.sort(key=lambda x: x.score, reverse=True)
            top_matches = matches[:request.top_k]
            
            processing_time = (time.time() - start_time) * 1000  # Convert to ms
            
            return MatchResponse(
                job_id=request.job_id,
                matches=top_matches,
                total_candidates=len(request.candidates),
                processing_time_ms=round(processing_time, 2)
            )
            
        except Exception as e:
            logger.error(f"Error matching candidates: {str(e)}")
            raise
    
    def _evaluate_candidate(self, candidate: Candidate, job_skills: List[str], weights: MatchWeights) -> Match:
        """Evaluate a single candidate against job requirements"""
        
        # Calculate skill matching score
        skill_score = self._calculate_skill_score(candidate.skills, job_skills)
        
        # Normalize evaluation score (already 0-100)
        eval_score = candidate.eval_score
        
        # Calculate project recency score
        recency_score = self._calculate_recency_score(candidate.recent_projects)
        
        # Calculate weighted overall score
        overall_score = (
            skill_score * weights.skill +
            eval_score * weights.eval +
            recency_score * weights.recency
        )
        
        # Generate matching reasons
        reasons = self._generate_match_reasons(candidate, job_skills)
        
        return Match(
            student_id=candidate.student_id,
            score=round(overall_score, 2),
            reasons=reasons,
            skill_score=round(skill_score, 2),
            eval_score=round(eval_score, 2),
            recency_score=round(recency_score, 2)
        )
    
    def _calculate_skill_score(self, candidate_skills: Dict[str, float], job_skills: List[str]) -> float:
        """Calculate skill matching score using simple matching and scoring"""
        if not job_skills or not candidate_skills:
            return 0.0
        
        # Convert to sets for easier comparison
        job_skills_set = set(skill.lower() for skill in job_skills)
        candidate_skills_lower = {k.lower(): v for k, v in candidate_skills.items()}
        
        # Calculate direct skill matches
        matched_skills = job_skills_set.intersection(set(candidate_skills_lower.keys()))
        
        if not matched_skills:
            return 0.0
        
        # Calculate score based on skill levels and coverage
        total_skill_score = 0.0
        max_possible_score = 0.0
        
        for job_skill in job_skills_set:
            max_possible_score += 5.0  # Max skill level is 5
            
            if job_skill in candidate_skills_lower:
                # Direct match - use actual skill level
                total_skill_score += candidate_skills_lower[job_skill]
            else:
                # Check for partial matches (e.g., 'machine learning' vs 'ml')
                partial_score = self._find_partial_skill_match(job_skill, candidate_skills_lower)
                total_skill_score += partial_score
        
        # Normalize to 0-100 scale
        if max_possible_score > 0:
            return (total_skill_score / max_possible_score) * 100
        
        return 0.0
    
    def _calculate_skill_similarity(self, candidate_skills: Dict[str, float], 
                                   required_skills: List[str]) -> float:
        """
        Calculate skill similarity using simple matching and scoring
        """
        try:
            if not candidate_skills or not required_skills:
                return 0.0
            
            total_score = 0.0
            matched_skills = 0
            
            # Normalize skill names for better matching
            candidate_skills_lower = {k.lower(): v for k, v in candidate_skills.items()}
            required_skills_lower = [skill.lower() for skill in required_skills]
            
            for required_skill in required_skills_lower:
                best_match_score = 0.0
                
                # Look for exact matches first
                if required_skill in candidate_skills_lower:
                    best_match_score = candidate_skills_lower[required_skill] / 5.0  # Normalize to 0-1
                    matched_skills += 1
                else:
                    # Look for partial matches
                    for candidate_skill, level in candidate_skills_lower.items():
                        # Check if skills are related (simple substring matching)
                        if (required_skill in candidate_skill or 
                            candidate_skill in required_skill or
                            self._skills_are_similar(required_skill, candidate_skill)):
                            partial_score = (level / 5.0) * 0.7  # Partial match gets 70% weight
                            best_match_score = max(best_match_score, partial_score)
                            if best_match_score > 0:
                                matched_skills += 1
                                break
                
                total_score += best_match_score
            
            # Calculate final similarity score
            if len(required_skills) > 0:
                similarity = total_score / len(required_skills)
                # Bonus for having more matching skills
                coverage_bonus = matched_skills / len(required_skills) * 0.1
                return min(similarity + coverage_bonus, 1.0)
            
            return 0.0
            
        except Exception as e:
            self.logger.error(f"Error calculating skill similarity: {e}")
            return 0.0
    
    def _skills_are_similar(self, skill1: str, skill2: str) -> bool:
        """
        Check if two skills are similar using simple heuristics
        """
        # Simple similarity check based on common words
        words1 = set(re.findall(r'\w+', skill1.lower()))
        words2 = set(re.findall(r'\w+', skill2.lower()))
        
        if not words1 or not words2:
            return False
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return (intersection / union) > 0.3 if union > 0 else False
    
    def _find_partial_skill_match(self, job_skill: str, candidate_skills: Dict[str, float]) -> float:
        """Find partial matches for skills (e.g., 'ml' for 'machine learning')"""
        # Simple keyword matching for common abbreviations
        skill_mappings = {
            'machine learning': ['ml', 'ai', 'artificial intelligence'],
            'artificial intelligence': ['ai', 'ml', 'machine learning'],
            'javascript': ['js', 'node', 'nodejs'],
            'python': ['py'],
            'database': ['db', 'sql', 'mysql', 'postgresql'],
            'react': ['reactjs'],
            'angular': ['angularjs']
        }
        
        if job_skill in skill_mappings:
            for alias in skill_mappings[job_skill]:
                if alias in candidate_skills:
                    return candidate_skills[alias] * 0.8  # Partial match penalty
        
        # Check if job_skill is a substring of any candidate skill
        for candidate_skill, level in candidate_skills.items():
            if job_skill in candidate_skill or candidate_skill in job_skill:
                return level * 0.6  # Partial match penalty
        
        return 0.0
    
    def _calculate_recency_score(self, projects: List) -> float:
        """Calculate score based on project recency"""
        if not projects:
            return 50.0  # Neutral score if no projects
        
        current_date = datetime.now()
        total_score = 0.0
        
        for project in projects:
            if hasattr(project, 'completion_date') and project.completion_date:
                try:
                    # Assume completion_date is in YYYY-MM-DD format
                    completion_date = datetime.strptime(project.completion_date, '%Y-%m-%d')
                    days_ago = (current_date - completion_date).days
                    
                    # Score based on recency (more recent = higher score)
                    if days_ago <= 30:  # Within 1 month
                        project_score = 100
                    elif days_ago <= 90:  # Within 3 months
                        project_score = 80
                    elif days_ago <= 180:  # Within 6 months
                        project_score = 60
                    elif days_ago <= 365:  # Within 1 year
                        project_score = 40
                    else:  # Older than 1 year
                        project_score = 20
                    
                    total_score += project_score
                except ValueError:
                    # If date parsing fails, give neutral score
                    total_score += 50
            else:
                # If no completion date, assume recent
                total_score += 70
        
        # Average score across all projects
        return total_score / len(projects) if projects else 50.0
    
    def _generate_match_reasons(self, candidate: Candidate, job_skills: List[str]) -> MatchReasons:
        """Generate detailed matching reasons"""
        candidate_skills_lower = {k.lower(): v for k, v in candidate.skills.items()}
        job_skills_lower = [skill.lower() for skill in job_skills]
        
        # Find top matching terms
        top_terms = []
        skill_gaps = []
        strengths = []
        
        for job_skill in job_skills_lower:
            if job_skill in candidate_skills_lower:
                skill_level = candidate_skills_lower[job_skill]
                if skill_level >= 4.0:
                    strengths.append(f"{job_skill} (level {skill_level})")
                    top_terms.append(job_skill)
                elif skill_level >= 2.0:
                    top_terms.append(job_skill)
                else:
                    skill_gaps.append(f"{job_skill} (low level: {skill_level})")
            else:
                skill_gaps.append(job_skill)
        
        # Add high-level skills as strengths
        for skill, level in candidate.skills.items():
            if level >= 4.5 and skill.lower() not in job_skills_lower:
                strengths.append(f"{skill} (level {level})")
        
        return MatchReasons(
            top_terms=top_terms[:5],  # Top 5 matching terms
            skill_gaps=skill_gaps[:5],  # Top 5 skill gaps
            strengths=strengths[:3]  # Top 3 strengths
        )