import { Response } from 'express';
import { AIService } from '@/services/ai.service';
import { ValidationService, leadIdParamSchema, aiRecommendationsQuerySchema, dateRangeQuerySchema, aiFeedbackSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/error';
import { logger } from '@/middleware/logging';
import { AuthenticatedRequest } from '@/types';

/**
 * AI Controller
 */
export class AIController {
  /**
   * Score a lead using AI
   * POST /api/core/leads/:leadId/score
   */
  static scoreLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Score the lead
    const result = await AIService.scoreLead(leadId, userId, userRole);

    logger.info('Lead scored successfully', {
      leadId,
      score: result.score,
      confidence: result.confidence,
      previousScore: result.previousScore,
      scoredBy: userId,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Lead scored successfully',
    });
  });

  /**
   * Batch score multiple leads
   * POST /api/core/ai/score-batch
   */
  static batchScoreLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate request body
    const { leadIds } = ValidationService.validateBody(
      req.body,
      'batchAnalyzeLeads'
    ) as { leadIds: string[] };

    // Batch score leads
    const result = await AIService.batchScoreLeads(leadIds, userId, userRole);

    logger.info('Batch lead scoring completed', {
      totalLeads: leadIds.length,
      successful: result.successful.length,
      failed: result.failed.length,
      scoredBy: userId,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Batch lead scoring completed',
    });
  });

  /**
   * Get AI service health status
   * GET /api/core/ai/health
   */
  static getAIServiceHealth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get AI service health
    const health = await AIService.getAIServiceHealth();

    res.status(200).json({
      success: true,
      data: health,
      message: 'AI service health status retrieved',
    });
  });

  /**
   * Get lead scoring history
   * GET /api/core/leads/:leadId/scoring-history
   */
  static getLeadScoringHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Get scoring history
    const history = await AIService.getLeadScoringHistory(leadId, userId, userRole);

    res.status(200).json({
      success: true,
      data: history,
      message: 'Lead scoring history retrieved successfully',
    });
  });

  /**
   * Get AI insights for a lead
   * GET /api/core/leads/:leadId/ai-insights
   */
  static getLeadAIInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Get latest scoring result for insights
    const result = await AIService.scoreLead(leadId, userId, userRole);

    // Format insights response
    const insights = {
      score: result.score,
      confidence: result.confidence,
      factors: result.factors,
      recommendations: result.recommendations,
      lastUpdated: new Date(),
      trends: {
        scoreChange: result.previousScore ? result.score - result.previousScore : 0,
        direction: result.previousScore ? 
          (result.score > result.previousScore ? 'up' : 
           result.score < result.previousScore ? 'down' : 'stable') : 'new',
      },
    };

    res.status(200).json({
      success: true,
      data: insights,
      message: 'AI insights retrieved successfully',
    });
  });

  /**
   * Get AI recommendations for lead management
   * GET /api/core/ai/recommendations
   */
  static getAIRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      aiRecommendationsQuerySchema,
      req.query
    ) as Record<string, any>;

    const { type = 'general', limit = 10 } = queryData;

    // Generate recommendations based on type
    let recommendations = [];

    switch (type) {
      case 'high-priority':
        recommendations = [
          {
            type: 'lead_follow_up',
            priority: 'high',
            title: 'Follow up with high-score leads',
            description: 'You have leads with scores above 80 that need immediate attention',
            action: 'Review and contact high-scoring leads',
            leadCount: 5,
          },
          {
            type: 'appointment_scheduling',
            priority: 'high',
            title: 'Schedule overdue appointments',
            description: 'Several qualified leads are waiting for appointment scheduling',
            action: 'Schedule appointments with qualified leads',
            leadCount: 3,
          },
        ];
        break;
      
      case 'optimization':
        recommendations = [
          {
            type: 'lead_scoring',
            priority: 'medium',
            title: 'Update lead scores',
            description: 'Some leads haven\'t been scored recently and may need updates',
            action: 'Run batch scoring on unscored leads',
            leadCount: 12,
          },
          {
            type: 'data_quality',
            priority: 'medium',
            title: 'Improve lead data quality',
            description: 'Leads with missing information have lower conversion rates',
            action: 'Complete missing lead information',
            leadCount: 8,
          },
        ];
        break;
      
      default:
        recommendations = [
          {
            type: 'daily_review',
            priority: 'low',
            title: 'Daily lead review',
            description: 'Review today\'s new leads and interactions',
            action: 'Check new leads and recent activities',
            leadCount: 7,
          },
          {
            type: 'performance_analysis',
            priority: 'low',
            title: 'Analyze conversion performance',
            description: 'Review your lead conversion metrics for this month',
            action: 'Generate performance report',
            leadCount: null,
          },
        ];
    }

    // Limit results
    recommendations = recommendations.slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        type,
        recommendations,
        generatedAt: new Date(),
        totalCount: recommendations.length,
      },
      message: 'AI recommendations retrieved successfully',
    });
  });

  /**
   * Get AI analytics dashboard data
   * GET /api/core/ai/analytics
   */
  static getAIAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      dateRangeQuerySchema,
      req.query
    ) as Record<string, any>;

    const dateFrom = queryData.dateFrom ? new Date(queryData.dateFrom) : 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const dateTo = queryData.dateTo ? new Date(queryData.dateTo) : new Date();

    // Mock analytics data (in a real implementation, this would come from the database)
    const analytics = {
      scoringActivity: {
        totalScored: 156,
        averageScore: 67.5,
        scoreDistribution: {
          '0-20': 12,
          '21-40': 28,
          '41-60': 45,
          '61-80': 52,
          '81-100': 19,
        },
        trends: {
          scoreImprovement: 8.3,
          conversionRate: 23.5,
        },
      },
      performance: {
        aiServiceUptime: 99.2,
        averageResponseTime: 1.2,
        successRate: 98.7,
        errorRate: 1.3,
      },
      insights: {
        topFactors: [
          { factor: 'Company size', impact: 'positive', weight: 0.85 },
          { factor: 'Recent interactions', impact: 'positive', weight: 0.78 },
          { factor: 'Email engagement', impact: 'positive', weight: 0.72 },
          { factor: 'Missing phone number', impact: 'negative', weight: -0.45 },
        ],
        recommendations: [
          'Focus on leads from mid-size companies',
          'Increase interaction frequency with high-score leads',
          'Collect phone numbers for better lead qualification',
        ],
      },
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'AI analytics retrieved successfully',
    });
  });

  /**
   * Train AI model with feedback (placeholder)
   * POST /api/core/ai/feedback
   */
  static submitAIFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Validate request body
    const { leadId, actualOutcome, feedback, rating } = ValidationService.validateBody(
      aiFeedbackSchema,
      req.body
    ) as Record<string, any>;

    // Log feedback for model training (in a real implementation, this would be sent to the AI service)
    logger.info('AI feedback submitted', {
      leadId,
      actualOutcome,
      feedback,
      rating,
      submittedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: {
        feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'received',
        message: 'Feedback will be used to improve AI model accuracy',
      },
      message: 'AI feedback submitted successfully',
    });
  });
}