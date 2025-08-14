import { Router } from 'express';
import { AIController } from '@/controllers/ai.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole } from '@/constants/enums';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const aiRateLimit = createRateLimit.aiScoring();
const strictRateLimit = createRateLimit.strict();

// All AI routes require authentication
router.use(authenticate);

// AI scoring routes
/**
 * @swagger
 * /api/core/ai/score/lead/{leadId}:
 *   post:
 *     tags: [AI]
 *     summary: Score a specific lead using AI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forceRescore:
 *                 type: boolean
 *                 default: false
 *               includeInsights:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Lead scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                     confidence:
 *                       type: number
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/score/lead/:leadId',
  aiRateLimit,
  validateContentType(['application/json']),
  AIController.scoreLead
);

/**
 * @swagger
 * /api/core/ai/score/batch:
 *   post:
 *     tags: [AI]
 *     summary: Score multiple leads in batch (Manager/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadIds]
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               forceRescore:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Batch scoring completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/score/batch',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  aiRateLimit,
  validateContentType(['application/json']),
  AIController.batchScoreLeads
);

// AI service health and monitoring
/**
 * @swagger
 * /api/core/ai/health:
 *   get:
 *     tags: [AI]
 *     summary: Get AI service health status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     uptime:
 *                       type: number
 *                     lastCheck:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       503:
 *         description: AI service unavailable
 */
router.get('/health',
  generalRateLimit,
  AIController.getAIServiceHealth
);

// AI insights and analytics
/**
 * @swagger
 * /api/core/ai/insights/lead/{leadId}:
 *   get:
 *     tags: [AI]
 *     summary: Get AI insights for a specific lead
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead AI insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     riskFactors:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.get('/insights/lead/:leadId',
  generalRateLimit,
  AIController.getLeadAIInsights
);

/**
 * @swagger
 * /api/core/ai/recommendations:
 *   get:
 *     tags: [AI]
 *     summary: Get AI recommendations for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [leads, actions, priorities]
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: AI recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations',
  generalRateLimit,
  AIController.getAIRecommendations
);

/**
 * @swagger
 * /api/core/ai/analytics/dashboard:
 *   get:
 *     tags: [AI]
 *     summary: Get AI analytics dashboard (Manager/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: AI analytics dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                     performance:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 */
router.get('/analytics/dashboard',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  AIController.getAIAnalytics
);

// AI scoring history
/**
 * @swagger
 * /api/core/ai/scoring/history/{leadId}:
 *   get:
 *     tags: [AI]
 *     summary: Get AI scoring history for a specific lead
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lead scoring history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: number
 *                           confidence:
 *                             type: number
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           version:
 *                             type: string
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.get('/scoring/history/:leadId',
  generalRateLimit,
  AIController.getLeadScoringHistory
);

// AI feedback and training
/**
 * @swagger
 * /api/core/ai/feedback:
 *   post:
 *     tags: [AI]
 *     summary: Submit AI feedback for training (Manager/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, feedback]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [scoring, recommendation, insight]
 *               feedback:
 *                 type: object
 *                 properties:
 *                   rating:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   comment:
 *                     type: string
 *                   accuracy:
 *                     type: boolean
 *               leadId:
 *                 type: string
 *               predictionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     feedbackId:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/feedback',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  strictRateLimit,
  validateContentType(['application/json']),
  AIController.submitAIFeedback
);

export { router as aiRoutes };