from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum

class SeniorityLevel(str, Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"

class Skill(BaseModel):
    name: str = Field(..., description="Skill name")
    weight: float = Field(..., ge=0.0, le=1.0, description="Skill importance weight (0-1)")

class JDParseRequest(BaseModel):
    job_description: str = Field(..., description="Job description text to parse")
    job_id: Optional[str] = Field(None, description="Optional job ID for reference")

class JDParseResponse(BaseModel):
    skills: List[Skill] = Field(..., description="Extracted technical skills with weights")
    soft_skills: List[str] = Field(..., description="Extracted soft skills")
    seniority_hint: SeniorityLevel = Field(..., description="Detected seniority level")
    job_id: Optional[str] = Field(None, description="Job ID if provided")

class CandidateSkill(BaseModel):
    name: str = Field(..., description="Skill name")
    level: float = Field(..., ge=0.0, le=5.0, description="Skill level (0-5)")

class Project(BaseModel):
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    technologies: List[str] = Field(default=[], description="Technologies used")
    completion_date: Optional[str] = Field(None, description="Project completion date")

class Candidate(BaseModel):
    student_id: str = Field(..., description="Unique student identifier")
    skills: Dict[str, float] = Field(..., description="Skills mapping: skill_name -> level (0-5)")
    eval_score: float = Field(..., ge=0.0, le=100.0, description="Evaluation score (0-100)")
    recent_projects: List[Project] = Field(default=[], description="Recent projects")

class MatchWeights(BaseModel):
    skill: float = Field(0.6, ge=0.0, le=1.0, description="Weight for skill matching")
    eval: float = Field(0.3, ge=0.0, le=1.0, description="Weight for evaluation score")
    recency: float = Field(0.1, ge=0.0, le=1.0, description="Weight for project recency")

class MatchRequest(BaseModel):
    job_id: str = Field(..., description="Job ID to match against")
    candidates: List[Candidate] = Field(..., description="List of candidates to evaluate")
    top_k: int = Field(10, ge=1, le=100, description="Number of top matches to return")
    weights: MatchWeights = Field(default_factory=MatchWeights, description="Scoring weights")

class MatchReasons(BaseModel):
    top_terms: List[str] = Field(..., description="Top matching terms/skills")
    skill_gaps: List[str] = Field(..., description="Missing or weak skills")
    strengths: List[str] = Field(default=[], description="Candidate strengths")

class Match(BaseModel):
    student_id: str = Field(..., description="Student identifier")
    score: float = Field(..., ge=0.0, le=100.0, description="Overall matching score (0-100)")
    reasons: MatchReasons = Field(..., description="Detailed matching reasons")
    skill_score: float = Field(..., ge=0.0, le=100.0, description="Skill matching score")
    eval_score: float = Field(..., ge=0.0, le=100.0, description="Evaluation score")
    recency_score: float = Field(..., ge=0.0, le=100.0, description="Project recency score")

class MatchResponse(BaseModel):
    job_id: str = Field(..., description="Job ID that was matched against")
    matches: List[Match] = Field(..., description="Ranked list of candidate matches")
    total_candidates: int = Field(..., description="Total number of candidates evaluated")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")