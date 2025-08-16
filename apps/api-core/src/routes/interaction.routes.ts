import { Router } from 'express';
import { InteractionController } from '@/controllers/interaction.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole, InteractionType } from '@/constants/enums';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const strictRateLimit = createRateLimit.strict();

// All interaction routes require authentication
router.use(authenticate);

// Interaction management routes
/**
 * @swagger
 * /api/core/interactions:
 *   get:
 *     tags:
 *       - Interactions
 *     summary: Get all interactions
 *     description: Retrieve a paginated list of interactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of interactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CALL, EMAIL, MEETING, NOTE, TASK]
 *         description: Filter by interaction type
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter by lead ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, COMPLETED, CANCELLED]
 *         description: Filter by interaction status
 *     responses:
 *       200:
 *         description: Interactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     interactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [CALL, EMAIL, MEETING, NOTE, TASK]
 *                           subject:
 *                             type: string
 *                           description:
 *                             type: string
 *                           scheduledAt:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           leadId:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  generalRateLimit,
  InteractionController.getInteractions
);

/**
 * @swagger
 * /api/core/interactions:
 *   post:
 *     tags:
 *       - Interactions
 *     summary: Create new interaction
 *     description: Create a new interaction (call, email, meeting, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - subject
 *               - leadId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CALL, EMAIL, MEETING, NOTE, TASK]
 *                 example: CALL
 *               subject:
 *                 type: string
 *                 example: Follow-up call
 *               description:
 *                 type: string
 *                 example: Discuss pricing options
 *               leadId:
 *                 type: string
 *                 example: lead123
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T10:00:00Z
 *               duration:
 *                 type: integer
 *                 example: 30
 *                 description: Duration in minutes
 *               notes:
 *                 type: string
 *                 example: Customer interested in premium package
 *     responses:
 *       201:
 *         description: Interaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     description:
 *                       type: string
 *                     leadId:
 *                       type: string
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: SCHEDULED
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/',
  generalRateLimit,
  validateContentType(['application/json']),
  InteractionController.createInteraction
);

/**
 * @swagger
 * /api/core/interactions/stats:
 *   get:
 *     tags:
 *       - Interactions
 *     summary: Get interaction statistics
 *     description: Retrieve statistics about interactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Interaction statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 250
 *                     byType:
 *                       type: object
 *                       properties:
 *                         CALL:
 *                           type: integer
 *                           example: 100
 *                         EMAIL:
 *                           type: integer
 *                           example: 80
 *                         MEETING:
 *                           type: integer
 *                           example: 50
 *                         NOTE:
 *                           type: integer
 *                           example: 15
 *                         TASK:
 *                           type: integer
 *                           example: 5
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         SCHEDULED:
 *                           type: integer
 *                           example: 75
 *                         COMPLETED:
 *                           type: integer
 *                           example: 150
 *                         CANCELLED:
 *                           type: integer
 *                           example: 25
 *                     thisWeek:
 *                       type: integer
 *                       example: 45
 *                     thisMonth:
 *                       type: integer
 *                       example: 180
 *       401:
 *         description: Unauthorized
 */
router.get('/stats',
  generalRateLimit,
  InteractionController.getInteractionStats
);

router.get('/upcoming',
  generalRateLimit,
  InteractionController.getUpcomingInteractions
);

router.get('/:id',
  generalRateLimit,
  InteractionController.getInteractionById
);

router.patch('/:id',
  generalRateLimit,
  validateContentType(['application/json']),
  InteractionController.updateInteraction
);

router.delete('/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  InteractionController.deleteInteraction
);

router.post('/:id/complete',
  generalRateLimit,
  validateContentType(['application/json']),
  InteractionController.completeInteraction
);

router.post('/:id/reschedule',
  generalRateLimit,
  validateContentType(['application/json']),
  InteractionController.rescheduleInteraction
);

// Lead-specific interaction routes
router.get('/lead/:leadId',
  generalRateLimit,
  InteractionController.getLeadInteractions
);

router.get('/lead/:leadId/summary',
  generalRateLimit,
  InteractionController.getLeadInteractionSummary
);

// Bulk operations
// router.post('/bulk',
//   authorize(UserRole.ADMIN, UserRole.MANAGER),
//   strictRateLimit,
//   validateContentType(['application/json']),
//   InteractionController.bulkCreateInteractions
// );

export { router as interactionRoutes };