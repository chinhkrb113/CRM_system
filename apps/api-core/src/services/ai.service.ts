import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/middleware/logging';
import { NotFoundError, ForbiddenError, BadRequestError, InternalServerError } from '@/utils/errors';
import { LeadService } from './lead.service';
import { config } from '@/config';
import axios, { AxiosError } from 'axios';

/**
 * AI Score Request
 */
export interface AIScoreRequest {
  leadId: string;
  leadData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    source: string;
    status: string;
    notes?: string;
    interactionCount?: number;
    appointmentCount?: number;
    lastInteractionDate?: Date;
  };
  context?: {
    userRole: string;
    timestamp: Date;
    requestId: string;
  };
}

/**
 * AI Score Response
 */
export interface AIScoreResponse {
  leadId: string;
  score: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  metadata: {
    model: string;
    version: string;
    processedAt: Date;
    processingTime: number;
  };
}

/**
 * AI Service Error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * AI Service
 */
export class AIService {
  private static readonly AI_SERVICE_URL = config.AI_SERVICE_URL;
  private static readonly AI_SERVICE_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Score a lead using AI service
   */
  static async scoreLead(
    leadId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{
    leadId: string;
    score: number;
    confidence: number;
    factors: {
      positive: string[];
      negative: string[];
    };
    recommendations: string[];
    previousScore?: number;
  }> {
    try {
      // Get lead data with access check
      const lead = await LeadService.getLeadById(leadId, userId, userRole);
      
      // Get interaction and appointment counts
      const [interactionCount, appointmentCount] = await Promise.all([
        prisma.interaction.count({
          where: { leadId },
        }),
        prisma.appointment.count({
          where: { leadId },
        }),
      ]);

      // Get last interaction date
      const lastInteraction = await prisma.interaction.findFirst({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Prepare AI request data
      const aiRequest: AIScoreRequest = {
        leadId,
        leadData: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone ?? undefined,
          company: lead.company ?? undefined,
          position: undefined, // Lead model doesn't have position field
          source: lead.source,
          status: lead.status,
          notes: lead.notes ?? undefined,
          interactionCount,
          appointmentCount,
          lastInteractionDate: lastInteraction?.createdAt,
        },
        context: {
          userRole,
          timestamp: new Date(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      };

      // Call AI service with retry logic
      const aiResponse = await this.callAIServiceWithRetry(aiRequest);

      // Validate AI response
      this.validateAIResponse(aiResponse);

      // Store previous score
      const previousScore = lead.score;

      // Update lead score in database
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          score: aiResponse.score,
          updatedAt: new Date(),
        },
      });

      // Log the scoring event
      logger.info('Lead scored successfully', {
        leadId,
        previousScore,
        newScore: aiResponse.score,
        confidence: aiResponse.confidence,
        userId,
        processingTime: aiResponse.metadata.processingTime,
      });

      return {
        leadId: aiResponse.leadId,
        score: aiResponse.score,
        confidence: aiResponse.confidence,
        factors: aiResponse.factors,
        recommendations: aiResponse.recommendations,
        previousScore: previousScore ?? undefined,
      };
    } catch (error) {
      logger.error('Lead scoring error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        userId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Call AI service with retry logic
   */
  private static async callAIServiceWithRetry(
    request: AIScoreRequest,
    attempt: number = 1
  ): Promise<AIScoreResponse> {
    try {
      const startTime = Date.now();
      
      // If AI service URL is not configured, use mock response
      if (!this.AI_SERVICE_URL || this.AI_SERVICE_URL.includes('mock')) {
        return this.generateMockAIResponse(request, startTime);
      }

      const response = await axios.post(
        `${this.AI_SERVICE_URL}/score`,
        request,
        {
          timeout: this.AI_SERVICE_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': request.context?.requestId,
            'Authorization': `Bearer ${config.AI_SERVICE_API_KEY || 'mock-key'}`,
          },
        }
      );

      const processingTime = Date.now() - startTime;
      
      // Add processing time to response metadata
      if (response.data.metadata) {
        response.data.metadata.processingTime = processingTime;
      }

      return response.data;
    } catch (error) {
      const isLastAttempt = attempt >= this.MAX_RETRIES;
      
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        
        logger.warn('AI service call failed', {
          attempt,
          statusCode,
          errorMessage,
          leadId: request.leadId,
          isLastAttempt,
        });

        // Don't retry on client errors (4xx)
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw new AIServiceError(
            `AI service error: ${errorMessage}`,
            statusCode,
            error
          );
        }

        // Retry on server errors (5xx) or rate limiting (429)
        if (!isLastAttempt) {
          await this.delay(this.RETRY_DELAY * attempt);
          return this.callAIServiceWithRetry(request, attempt + 1);
        }

        throw new AIServiceError(
          `AI service unavailable after ${this.MAX_RETRIES} attempts: ${errorMessage}`,
          statusCode,
          error
        );
      }

      // Handle non-Axios errors
      if (!isLastAttempt) {
        await this.delay(this.RETRY_DELAY * attempt);
        return this.callAIServiceWithRetry(request, attempt + 1);
      }

      throw new InternalServerError(
        `AI service error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate mock AI response for testing/development
   */
  private static generateMockAIResponse(
    request: AIScoreRequest,
    startTime: number
  ): AIScoreResponse {
    const { leadData } = request;
    
    // Simple scoring algorithm for mock
    let score = 50; // Base score
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
    };
    const recommendations = [] as string[];

    // Company factor
    if (leadData.company) {
      score += 15;
      factors.positive.push('Has company information');
    } else {
      factors.negative.push('Missing company information');
      recommendations.push('Collect company information');
    }

    // Position factor
    if (leadData.position) {
      score += 10;
      factors.positive.push('Has position/title information');
    } else {
      recommendations.push('Identify lead\'s position or role');
    }

    // Phone factor
    if (leadData.phone) {
      score += 10;
      factors.positive.push('Has phone contact');
    } else {
      factors.negative.push('Missing phone contact');
      recommendations.push('Obtain phone number for better communication');
    }

    // Interaction factor
    if (leadData.interactionCount && leadData.interactionCount > 0) {
      score += Math.min(leadData.interactionCount * 5, 20);
      factors.positive.push(`Has ${leadData.interactionCount} interaction(s)`);
    } else {
      factors.negative.push('No interactions recorded');
      recommendations.push('Schedule initial interaction');
    }

    // Appointment factor
    if (leadData.appointmentCount && leadData.appointmentCount > 0) {
      score += Math.min(leadData.appointmentCount * 10, 25);
      factors.positive.push(`Has ${leadData.appointmentCount} appointment(s)`);
    } else {
      recommendations.push('Schedule a meeting or call');
    }

    // Recent activity factor
    if (leadData.lastInteractionDate) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - leadData.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastInteraction <= 7) {
        score += 15;
        factors.positive.push('Recent activity (within 7 days)');
      } else if (daysSinceLastInteraction <= 30) {
        score += 5;
        factors.positive.push('Recent activity (within 30 days)');
      } else {
        factors.negative.push('No recent activity');
        recommendations.push('Re-engage with the lead');
      }
    }

    // Source factor
    const highValueSources = ['referral', 'website', 'linkedin'];
    if (highValueSources.includes(leadData.source.toLowerCase())) {
      score += 10;
      factors.positive.push(`High-value source: ${leadData.source}`);
    }

    // Status factor
    if (leadData.status === 'qualified') {
      score += 20;
      factors.positive.push('Lead is qualified');
    } else if (leadData.status === 'new') {
      recommendations.push('Qualify the lead');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    // Calculate confidence based on available data
    const dataPoints = [
      leadData.company,
      leadData.position,
      leadData.phone,
      leadData.interactionCount,
      leadData.appointmentCount,
      leadData.lastInteractionDate,
    ].filter(Boolean).length;
    
    const confidence = Math.min(95, 40 + (dataPoints * 10));

    // Add general recommendations if score is low
    if (score < 40) {
      recommendations.push('Focus on lead qualification and engagement');
    } else if (score > 80) {
      recommendations.push('High-priority lead - consider immediate follow-up');
    }

    const processingTime = Date.now() - startTime;

    return {
      leadId: request.leadId,
      score,
      confidence,
      factors,
      recommendations,
      metadata: {
        model: 'mock-scoring-v1',
        version: '1.0.0',
        processedAt: new Date(),
        processingTime,
      },
    };
  }

  /**
   * Validate AI service response
   */
  private static validateAIResponse(response: any): void {
    if (!response) {
      throw new AIServiceError('Empty response from AI service');
    }

    if (typeof response.score !== 'number' || response.score < 0 || response.score > 100) {
      throw new AIServiceError('Invalid score in AI response');
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 100) {
      throw new AIServiceError('Invalid confidence in AI response');
    }

    if (!response.factors || !Array.isArray(response.factors.positive) || !Array.isArray(response.factors.negative)) {
      throw new AIServiceError('Invalid factors in AI response');
    }

    if (!Array.isArray(response.recommendations)) {
      throw new AIServiceError('Invalid recommendations in AI response');
    }
  }

  /**
   * Batch score multiple leads
   */
  static async batchScoreLeads(
    leadIds: string[],
    userId: string,
    userRole: UserRole
  ): Promise<{
    successful: Array<{
      leadId: string;
      score: number;
      confidence: number;
    }>;
    failed: Array<{
      leadId: string;
      error: string;
    }>;
  }> {
    try {
      const results = {
        successful: [] as Array<{ leadId: string; score: number; confidence: number }>,
        failed: [] as Array<{ leadId: string; error: string }>,
      };

      // Process leads in batches to avoid overwhelming the AI service
      const batchSize = 5;
      for (let i = 0; i < leadIds.length; i += batchSize) {
        const batch = leadIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (leadId) => {
          try {
            const result = await this.scoreLead(leadId, userId, userRole);
            results.successful.push({
              leadId: result.leadId,
              score: result.score,
              confidence: result.confidence,
            });
          } catch (error) {
            results.failed.push({
              leadId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });

        await Promise.all(batchPromises);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < leadIds.length) {
          await this.delay(500);
        }
      }

      logger.info('Batch lead scoring completed', {
        totalLeads: leadIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        userId,
      });

      return results;
    } catch (error) {
      logger.error('Batch lead scoring error', {
        error: error instanceof Error ? error.message : String(error),
        leadIds,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get AI service health status
   */
  static async getAIServiceHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    version?: string;
    error?: string;
  }> {
    try {
      if (!this.AI_SERVICE_URL || this.AI_SERVICE_URL.includes('mock')) {
        return {
          status: 'healthy',
          responseTime: 1,
          version: 'mock-1.0.0',
        };
      }

      const startTime = Date.now();
      
      const response = await axios.get(
        `${this.AI_SERVICE_URL}/health`,
        {
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${config.AI_SERVICE_API_KEY || 'mock-key'}`,
          },
        }
      );

      const responseTime = Date.now() - startTime;

      return {
        status: response.data.status === 'ok' ? 'healthy' : 'unhealthy',
        responseTime,
        version: response.data.version,
      };
    } catch (error) {
      logger.warn('AI service health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Utility function to add delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scoring history for a lead
   */
  static async getLeadScoringHistory(
    leadId: string,
    userId: string,
    userRole: UserRole
  ): Promise<Array<{
    score: number;
    timestamp: Date;
    factors?: any;
    confidence?: number;
  }>> {
    try {
      // Check if user has access to this lead
      await LeadService.getLeadById(leadId, userId, userRole);

      // Get audit logs for score changes
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity: 'LEAD',
          entityId: leadId,
          action: 'UPDATE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to last 50 score changes
      });

      // Extract score history from audit logs
      const history = auditLogs.map(log => {
        const newData = log.newData as any;
        return {
          score: newData?.score || 0,
          timestamp: log.createdAt,
          factors: undefined,
          confidence: undefined,
        };
      });

      return history;
    } catch (error) {
      logger.error('Get lead scoring history error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        userId,
      });
      throw error;
    }
  }
}