import axios, { AxiosInstance } from 'axios';
import { createError } from '../middleware/errorHandler';

export interface JobParseRequest {
  title: string;
  description: string;
  requirements: string;
  company: string;
  industry: string;
}

export interface JobParseResponse {
  skills: Array<{
    name: string;
    category: string;
    required: boolean;
    weight: number;
    description?: string;
  }>;
  requirements: {
    education: string[];
    experience: string;
    certifications: string[];
  };
  responsibilities: string[];
  benefits: string[];
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  metadata: {
    confidence: number;
    processingTime: number;
    version: string;
  };
}

export interface MatchRequest {
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    skills: Array<{
      name: string;
      category: string;
      required: boolean;
      weight: number;
    }>;
    parsedData?: any;
  };
  candidates: Array<{
    id: string;
    name: string;
    email: string;
    skills: Array<{
      name: string;
      category: string;
      level: number;
      verified: boolean;
    }>;
    evaluations: Array<{
      type: string;
      category: string;
      score: number;
    }>;
    profile: any;
  }>;
  topK: number;
  weights: {
    skill: number;
    evaluation: number;
  };
}

export interface MatchResponse {
  matches: Array<{
    candidateId: string;
    candidate: {
      id: string;
      name: string;
      email: string;
    };
    score: number;
    breakdown: {
      skillMatch: number;
      evaluationScore: number;
      overallFit: number;
    };
    matchedSkills: Array<{
      skill: string;
      candidateLevel: number;
      required: boolean;
      match: boolean;
    }>;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  }>;
  metadata: {
    totalCandidates: number;
    processingTime: number;
    weights: {
      skill: number;
      evaluation: number;
    };
  };
}

export class AiJdService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_JD_SERVICE_URL || 'http://localhost:3003';
    this.apiKey = process.env.AI_JD_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`AI-JD Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('AI-JD Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`AI-JD Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('AI-JD Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  async parseJobDescription(jobData: JobParseRequest): Promise<JobParseResponse> {
    try {
      const response = await this.client.post('/parse_jd', {
        job_description: {
          title: jobData.title,
          description: jobData.description,
          requirements: jobData.requirements,
          company: jobData.company,
          industry: jobData.industry
        }
      });

      return this.transformParseResponse(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to parse job description');
      throw error; // This won't be reached due to handleError throwing
    }
  }

  async matchCandidates(matchData: MatchRequest): Promise<MatchResponse> {
    try {
      const response = await this.client.post('/match', {
        job: {
          id: matchData.job.id,
          title: matchData.job.title,
          description: matchData.job.description,
          requirements: matchData.job.requirements,
          skills: matchData.job.skills,
          parsed_data: matchData.job.parsedData
        },
        candidates: matchData.candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          skills: candidate.skills,
          evaluations: candidate.evaluations,
          profile: candidate.profile
        })),
        parameters: {
          top_k: matchData.topK,
          weights: {
            skill_weight: matchData.weights.skill,
            evaluation_weight: matchData.weights.evaluation
          }
        }
      });

      return this.transformMatchResponse(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to match candidates');
      throw error; // This won't be reached due to handleError throwing
    }
  }

  async getServiceHealth(): Promise<{ status: string; version: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      this.handleError(error, 'AI-JD service health check failed');
      throw error;
    }
  }

  private transformParseResponse(data: any): JobParseResponse {
    // Transform AI-JD response format to our internal format
    return {
      skills: data.extracted_skills?.map((skill: any) => ({
        name: skill.name || skill.skill_name,
        category: skill.category || 'technical',
        required: skill.required ?? true,
        weight: skill.weight ?? 1.0,
        description: skill.description
      })) || [],
      requirements: {
        education: data.requirements?.education || [],
        experience: data.requirements?.experience || '',
        certifications: data.requirements?.certifications || []
      },
      responsibilities: data.responsibilities || [],
      benefits: data.benefits || [],
      location: data.location,
      salary: data.salary ? {
        min: data.salary.min,
        max: data.salary.max,
        currency: data.salary.currency || 'USD'
      } : undefined,
      metadata: {
        confidence: data.metadata?.confidence || 0.8,
        processingTime: data.metadata?.processing_time || 0,
        version: data.metadata?.version || '1.0'
      }
    };
  }

  private transformMatchResponse(data: any): MatchResponse {
    // Transform AI-JD response format to our internal format
    return {
      matches: data.matches?.map((match: any) => ({
        candidateId: match.candidate_id || match.candidate.id,
        candidate: {
          id: match.candidate.id,
          name: match.candidate.name,
          email: match.candidate.email
        },
        score: match.score || 0,
        breakdown: {
          skillMatch: match.breakdown?.skill_match || 0,
          evaluationScore: match.breakdown?.evaluation_score || 0,
          overallFit: match.breakdown?.overall_fit || match.score || 0
        },
        matchedSkills: match.matched_skills?.map((skill: any) => ({
          skill: skill.skill || skill.name,
          candidateLevel: skill.candidate_level || skill.level,
          required: skill.required ?? true,
          match: skill.match ?? false
        })) || [],
        strengths: match.strengths || [],
        gaps: match.gaps || [],
        recommendation: match.recommendation || ''
      })) || [],
      metadata: {
        totalCandidates: data.metadata?.total_candidates || 0,
        processingTime: data.metadata?.processing_time || 0,
        weights: {
          skill: data.metadata?.weights?.skill_weight || 0.7,
          evaluation: data.metadata?.weights?.evaluation_weight || 0.3
        }
      }
    };
  }

  private handleError(error: any, message: string): never {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw createError('AI-JD service is not available', 503);
      }
      
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error || error.response.data?.message || message;
        
        if (status === 400) {
          throw createError(`Invalid request: ${errorMessage}`, 400);
        } else if (status === 401) {
          throw createError('AI-JD service authentication failed', 401);
        } else if (status === 429) {
          throw createError('AI-JD service rate limit exceeded', 429);
        } else if (status >= 500) {
          throw createError('AI-JD service internal error', 502);
        }
        
        throw createError(errorMessage, status);
      }
      
      if (error.request) {
        throw createError('AI-JD service did not respond', 503);
      }
    }
    
    console.error('AI-JD Service Error:', error);
    throw createError(message, 500);
  }

  // Utility method to test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getServiceHealth();
      return true;
    } catch (error) {
      console.error('AI-JD service connection test failed:', error);
      return false;
    }
  }
}