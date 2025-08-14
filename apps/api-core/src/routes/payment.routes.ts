import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole, PaymentStatus } from '@/constants/enums';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const strictRateLimit = createRateLimit.strict();
const paymentRateLimit = createRateLimit.paymentLinks();

// Public routes (no authentication required)
/**
 * @swagger
 * /api/core/payments/link/{linkId}/public:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment link details (public)
 *     parameters:
 *       - name: linkId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment link details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Payment link not found
 *       410:
 *         description: Payment link expired
 */
router.get('/link/:linkId/public',
  paymentRateLimit,
  PaymentController.getPaymentLinkDetails
);

/**
 * @swagger
 * /api/core/payments/link/{linkId}/process:
 *   post:
 *     tags: [Payments]
 *     summary: Process payment (public)
 *     parameters:
 *       - name: linkId
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
 *             required: [paymentMethod, customerInfo]
 *             properties:
 *               paymentMethod:
 *                 type: object
 *               customerInfo:
 *                 type: object
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Payment link not found
 *       410:
 *         description: Payment link expired
 */
router.post('/link/:linkId/process',
  paymentRateLimit,
  validateContentType(['application/json']),
  PaymentController.processPayment
);

/**
 * @swagger
 * /api/core/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Payment webhook (for payment provider callbacks)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 */
// Webhook route (no authentication, but should be secured with webhook signature)
router.post('/webhook',
  validateContentType(['application/json']),
  PaymentController.updatePaymentStatus
);

// All other payment routes require authentication
router.use(authenticate);

// Payment management routes
/**
 * @swagger
 * /api/core/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 *       - name: leadId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments
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
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  generalRateLimit,
  PaymentController.getPayments
);

/**
 * @swagger
 * /api/core/payments/link:
 *   post:
 *     tags: [Payments]
 *     summary: Create payment link (Sales/Manager/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, amount, description]
 *             properties:
 *               leadId:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Payment link created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sales/Manager/Admin role required
 */
router.post('/link',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES),
  generalRateLimit,
  validateContentType(['application/json']),
  PaymentController.createPaymentLink
);

/**
 * @swagger
 * /api/core/payments/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment statistics (Manager/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 */
router.get('/stats',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  PaymentController.getPaymentStats
);

router.get('/expired',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  PaymentController.getExpiredPaymentLinks
);

router.get('/:id',
  generalRateLimit,
  PaymentController.getPaymentById
);

router.post('/:id/cancel',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES),
  generalRateLimit,
  PaymentController.cancelPayment
);

router.post('/:id/resend',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES),
  strictRateLimit,
  PaymentController.resendPaymentLink
);

// Lead-specific payment routes
router.get('/lead/:leadId',
  generalRateLimit,
  PaymentController.getLeadPayments
);

// Admin operations
router.post('/expired/mark-failed',
  authorize(UserRole.ADMIN),
  strictRateLimit,
  PaymentController.markExpiredPaymentsAsFailed
);

router.post('/:id/simulate-completion',
  authorize(UserRole.ADMIN),
  strictRateLimit,
  validateContentType(['application/json']),
  PaymentController.simulatePaymentCompletion
);

export { router as paymentRoutes };