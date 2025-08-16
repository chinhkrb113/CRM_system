import re
import logging
from typing import List, Dict, Tuple
# from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from collections import Counter
import re
from models.jd_models import JDParseRequest, JDParseResponse, Skill, SeniorityLevel

logger = logging.getLogger(__name__)

class JDParserService:
    def __init__(self):
        # Predefined skill keywords database
        self.technical_skills = {
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'php', 'ruby',
            'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
            
            # Frameworks & Libraries
            'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask', 'fastapi',
            'spring', 'hibernate', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
            'pandas', 'numpy', 'matplotlib', 'seaborn',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
            'oracle', 'sqlite', 'dynamodb',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
            'terraform', 'ansible', 'chef', 'puppet', 'nginx', 'apache',
            
            # Tools & Technologies
            'git', 'linux', 'unix', 'bash', 'powershell', 'vim', 'vscode', 'intellij',
            'jira', 'confluence', 'slack', 'teams',
            
            # Methodologies
            'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'tdd', 'bdd',
            
            # Data & Analytics
            'hadoop', 'spark', 'kafka', 'airflow', 'tableau', 'powerbi', 'looker',
            'etl', 'data warehouse', 'machine learning', 'deep learning', 'nlp',
            
            # Mobile
            'ios', 'android', 'react native', 'flutter', 'xamarin',
            
            # Security
            'cybersecurity', 'penetration testing', 'oauth', 'jwt', 'ssl', 'tls'
        }
        
        self.soft_skills = {
            'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
            'creativity', 'adaptability', 'time management', 'project management',
            'analytical thinking', 'attention to detail', 'collaboration', 'mentoring',
            'presentation', 'negotiation', 'customer service', 'emotional intelligence'
        }
        
        self.seniority_keywords = {
            SeniorityLevel.JUNIOR: ['junior', 'entry level', 'graduate', 'intern', '0-2 years', 'beginner'],
            SeniorityLevel.MID: ['mid level', 'intermediate', '2-5 years', '3-5 years', 'experienced'],
            SeniorityLevel.SENIOR: ['senior', '5+ years', '5-8 years', 'expert', 'advanced'],
            SeniorityLevel.LEAD: ['lead', 'team lead', 'tech lead', 'technical lead', 'manager'],
            SeniorityLevel.PRINCIPAL: ['principal', 'architect', 'staff', 'distinguished', '10+ years']
        }
        
        # Note: TF-IDF vectorizer removed to avoid sklearn dependency
        
    def parse_jd(self, request: JDParseRequest) -> JDParseResponse:
        """Parse job description to extract skills and seniority level"""
        try:
            jd_text = request.job_description.lower()
            
            # Extract technical skills
            technical_skills = self._extract_technical_skills(jd_text)
            
            # Extract soft skills
            soft_skills = self._extract_soft_skills(jd_text)
            
            # Determine seniority level
            seniority = self._determine_seniority(jd_text)
            
            return JDParseResponse(
                skills=technical_skills,
                soft_skills=soft_skills,
                seniority_hint=seniority,
                job_id=request.job_id
            )
            
        except Exception as e:
            logger.error(f"Error parsing JD: {str(e)}")
            raise
    
    def _extract_technical_skills(self, jd_text: str) -> List[Skill]:
        """Extract technical skills using keyword matching and TF-IDF"""
        found_skills = []
        
        # Simple keyword matching
        for skill in self.technical_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            matches = re.findall(pattern, jd_text)
            
            if matches:
                # Calculate weight based on frequency and context
                frequency = len(matches)
                # Normalize frequency to weight (simple heuristic)
                weight = min(0.1 + (frequency * 0.1), 1.0)
                
                # Boost weight for skills mentioned in requirements section
                if any(section in jd_text for section in ['requirements', 'required', 'must have']):
                    if skill in jd_text[jd_text.find('requirements'):] if 'requirements' in jd_text else jd_text:
                        weight = min(weight * 1.5, 1.0)
                
                found_skills.append(Skill(name=skill, weight=round(weight, 2)))
        
        # Sort by weight and return top skills
        found_skills.sort(key=lambda x: x.weight, reverse=True)
        return found_skills[:20]  # Limit to top 20 skills
    
    def _extract_soft_skills(self, jd_text: str) -> List[str]:
        """Extract soft skills using keyword matching"""
        found_soft_skills = []
        
        for skill in self.soft_skills:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, jd_text):
                found_soft_skills.append(skill)
        
        return found_soft_skills
    
    def _determine_seniority(self, jd_text: str) -> SeniorityLevel:
        """Determine seniority level based on keywords"""
        seniority_scores = {level: 0 for level in SeniorityLevel}
        
        for level, keywords in self.seniority_keywords.items():
            for keyword in keywords:
                pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
                matches = len(re.findall(pattern, jd_text))
                seniority_scores[level] += matches
        
        # Return the level with highest score, default to MID if no clear indication
        if max(seniority_scores.values()) == 0:
            return SeniorityLevel.MID
        
        return max(seniority_scores.items(), key=lambda x: x[1])[0]