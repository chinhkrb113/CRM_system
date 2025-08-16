import { Router } from 'express';
import { LeadController } from '@/controllers/lead.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole, LeadStatus, LeadSource } from '@/constants/enums';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const strictRateLimit = createRateLimit.strict();

// All lead routes require authentication
router.use(authenticate);

// Lead management routes
/**
 * @swagger
 * /api/core/leads:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get all leads
 *     description: Retrieve a paginated list of leads with optional filtering
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
 *         description: Number of leads per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, CONVERTED, LOST]
 *         description: Filter by lead status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [WEBSITE, SOCIAL_MEDIA, EMAIL, PHONE, REFERRAL, OTHER]
 *         description: Filter by lead source
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in lead name, email, or company
 *     responses:
 *       200:
 *         description: List of leads retrieved successfully
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
 *                     leads:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           company:
 *                             type: string
 *                           status:
 *                             type: string
 *                           source:
 *                             type: string
 *                           score:
 *                             type: integer
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
  LeadController.getLeads
);

/**
 * @swagger
 * /api/core/leads:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Create new lead
 *     description: Create a new lead in the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               company:
 *                 type: string
 *                 example: Acme Corp
 *               source:
 *                 type: string
 *                 enum: [WEBSITE, SOCIAL_MEDIA, EMAIL, PHONE, REFERRAL, OTHER]
 *                 example: WEBSITE
 *               notes:
 *                 type: string
 *                 example: Interested in our premium package
 *     responses:
 *       201:
 *         description: Lead created successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     company:
 *                       type: string
 *                     source:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: NEW
 *                     score:
 *                       type: integer
 *                       example: 0
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Lead with this email already exists
 */
router.post('/',
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.createLead
);

/**
 * @swagger
 * /api/core/leads/stats:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get lead statistics
 *     description: Retrieve statistics about leads (counts by status, source, etc.)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead statistics retrieved successfully
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
 *                       example: 150
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         NEW:
 *                           type: integer
 *                           example: 45
 *                         CONTACTED:
 *                           type: integer
 *                           example: 30
 *                         QUALIFIED:
 *                           type: integer
 *                           example: 25
 *                         CONVERTED:
 *                           type: integer
 *                           example: 35
 *                         LOST:
 *                           type: integer
 *                           example: 15
 *                     bySource:
 *                       type: object
 *                       properties:
 *                         WEBSITE:
 *                           type: integer
 *                         SOCIAL_MEDIA:
 *                           type: integer
 *                         EMAIL:
 *                           type: integer
 *                         PHONE:
 *                           type: integer
 *                         REFERRAL:
 *                           type: integer
 *                         OTHER:
 *                           type: integer
 *                     conversionRate:
 *                       type: number
 *                       format: float
 *                       example: 23.33
 *       401:
 *         description: Unauthorized
 */
router.get('/stats',
  generalRateLimit,
  LeadController.getLeadStats
);

// Export leads - TODO: Implement exportLeads method in LeadService
// router.get('/export',
//   authorize(UserRole.ADMIN, UserRole.MANAGER),
//   strictRateLimit,
//   LeadController.exportLeads
// );

/**
 * @swagger
 * /api/core/leads/{id}:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get lead by ID
 *     description: Retrieve a specific lead by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead retrieved successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     company:
 *                       type: string
 *                     status:
 *                       type: string
 *                     source:
 *                       type: string
 *                     score:
 *                       type: integer
 *                     notes:
 *                       type: string
 *                     assignedTo:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.get('/:id',
  generalRateLimit,
  LeadController.getLeadById
);

/**
 * @swagger
 * /api/core/leads/{id}:
 *   patch:
 *     tags:
 *       - Leads
 *     summary: Update lead
 *     description: Update an existing lead
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NEW, CONTACTED, QUALIFIED, CONVERTED, LOST]
 *               source:
 *                 type: string
 *                 enum: [WEBSITE, SOCIAL_MEDIA, EMAIL, PHONE, REFERRAL, OTHER]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     company:
 *                       type: string
 *                     status:
 *                       type: string
 *                     source:
 *                       type: string
 *                     score:
 *                       type: integer
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.patch('/:id',
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.updateLead
);

/**
 * @swagger
 * /api/core/leads/{id}:
 *   put:
 *     tags:
 *       - Leads
 *     summary: Update lead (PUT method)
 *     description: Update a lead using PUT method (same as PATCH)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NEW, CONTACTED, QUALIFIED, CONVERTED, LOST]
 *               source:
 *                 type: string
 *                 enum: [WEBSITE, SOCIAL_MEDIA, EMAIL, PHONE, REFERRAL, OTHER]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.put('/:id',
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.updateLeadPut
);

/**
 * @swagger
 * /api/core/leads/{id}:
 *   delete:
 *     tags:
 *       - Leads
 *     summary: Delete lead
 *     description: Delete a lead from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lead deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.delete('/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  LeadController.deleteLead
);

/**
 * @swagger
 * /api/core/leads/{id}/score:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Update lead score
 *     description: Update the scoring of a lead based on various criteria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *                 description: Lead score (0-100)
 *               reason:
 *                 type: string
 *                 example: High engagement with email campaigns
 *                 description: Reason for score update
 *     responses:
 *       200:
 *         description: Lead score updated successfully
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
 *                     score:
 *                       type: integer
 *                     previousScore:
 *                       type: integer
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.post('/:id/score',
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.updateLeadScore
);

/**
 * @swagger
 * /api/core/leads/{id}/status:
 *   put:
 *     tags:
 *       - Leads
 *     summary: Update lead status
 *     description: Update the status of a specific lead
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NEW, CONTACTED, QUALIFIED, CONVERTED, LOST, PROPOSAL_SENT, NEGOTIATION, CLOSED_WON, CLOSED_LOST]
 *                 description: New status for the lead
 *     responses:
 *       200:
 *         description: Lead status updated successfully
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
 *                   description: Updated lead object
 *                 message:
 *                   type: string
 *                   example: Lead status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.put('/:id/status',
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.updateLeadStatus
);

/**
 * @swagger
 * /api/core/leads/{id}/assign:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Assign lead to user
 *     description: Assign a lead to a specific user (Admin/Manager only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 example: user123
 *                 description: User ID to assign the lead to
 *               notes:
 *                 type: string
 *                 example: Assigned due to expertise in this industry
 *                 description: Assignment notes
 *     responses:
 *       200:
 *         description: Lead assigned successfully
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
 *                     assignedTo:
 *                       type: string
 *                     assignedBy:
 *                       type: string
 *                     assignedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager role required
 *       404:
 *         description: Lead not found
 */
router.post('/:id/assign',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.assignLead
);

/**
 * @swagger
 * /api/core/leads/{id}/convert:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Convert lead to customer
 *     description: Convert a qualified lead to a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversionValue
 *             properties:
 *               conversionValue:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 example: 5000.00
 *                 description: Value of the conversion in currency
 *               conversionNotes:
 *                 type: string
 *                 example: Purchased premium package
 *                 description: Notes about the conversion
 *               customerData:
 *                 type: object
 *                 properties:
 *                   billingAddress:
 *                     type: string
 *                   paymentMethod:
 *                     type: string
 *                   contractDetails:
 *                     type: string
 *                 description: Additional customer data
 *     responses:
 *       200:
 *         description: Lead converted successfully
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
 *                     leadId:
 *                       type: string
 *                     customerId:
 *                       type: string
 *                     conversionValue:
 *                       type: number
 *                       format: float
 *                     convertedAt:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: CONVERTED
 *       400:
 *         description: Validation error or lead not qualified for conversion
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.post('/:id/convert',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES),
  generalRateLimit,
  validateContentType(['application/json']),
  LeadController.convertLead
);

// TODO: Implement getLeadTimeline method in LeadService
// router.get('/:id/timeline',
//   generalRateLimit,
//   LeadController.getLeadTimeline
// );

// TODO: Implement bulkUpdateLeads method in LeadService
// router.patch('/bulk',
//   authorize(UserRole.ADMIN, UserRole.MANAGER),
//   strictRateLimit,
//   validateContentType(['application/json']),
//   LeadController.bulkUpdateLeads
// );

export { router as leadRoutes };