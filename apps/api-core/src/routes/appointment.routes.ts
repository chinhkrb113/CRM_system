import { Router } from 'express';
import { AppointmentController } from '@/controllers/appointment.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole, AppointmentStatus } from '@/constants/enums';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const strictRateLimit = createRateLimit.strict();

// All appointment routes require authentication
router.use(authenticate);

// Appointment management routes
/**
 * @swagger
 * /api/core/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: Get all appointments
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
 *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
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
 *         description: List of appointments
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
 *                     appointments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [Appointments]
 *     summary: Create new appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, scheduledAt, type]
 *             properties:
 *               leadId:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *               duration:
 *                 type: integer
 *               notes:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/',
  generalRateLimit,
  AppointmentController.getAppointments
);

router.post('/',
  generalRateLimit,
  validateContentType(['application/json']),
  AppointmentController.createAppointment
);

/**
 * @swagger
 * /api/core/appointments/stats:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointment statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment statistics
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
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  generalRateLimit,
  AppointmentController.getAppointmentStats
);

/**
 * @swagger
 * /api/core/appointments/today:
 *   get:
 *     tags: [Appointments]
 *     summary: Get today's appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments
 *       401:
 *         description: Unauthorized
 */
router.get('/today',
  generalRateLimit,
  AppointmentController.getTodayAppointments
);

/**
 * @swagger
 * /api/core/appointments/upcoming:
 *   get:
 *     tags: [Appointments]
 *     summary: Get upcoming appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming appointments
 *       401:
 *         description: Unauthorized
 */
router.get('/upcoming',
  generalRateLimit,
  AppointmentController.getUpcomingAppointments
);

/**
 * @swagger
 * /api/core/appointments/calendar:
 *   get:
 *     tags: [Appointments]
 *     summary: Get calendar view of appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: month
 *         in: query
 *         schema:
 *           type: integer
 *       - name: year
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calendar view data
 *       401:
 *         description: Unauthorized
 */
router.get('/calendar',
  generalRateLimit,
  AppointmentController.getCalendarView
);

/**
 * @swagger
 * /api/core/appointments/availability:
 *   get:
 *     tags: [Appointments]
 *     summary: Check availability for appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: duration
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available time slots
 *       401:
 *         description: Unauthorized
 */
router.get('/availability',
  generalRateLimit,
  AppointmentController.checkAvailability
);

/**
 * @swagger
 * /api/core/appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 *   patch:
 *     tags: [Appointments]
 *     summary: Update appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *               duration:
 *                 type: integer
 *               notes:
 *                 type: string
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.get('/:id',
  generalRateLimit,
  AppointmentController.getAppointmentById
);

router.patch('/:id',
  generalRateLimit,
  validateContentType(['application/json']),
  AppointmentController.updateAppointment
);

/**
 * @swagger
 * /api/core/appointments/{id}/cancel:
 *   post:
 *     tags: [Appointments]
 *     summary: Cancel appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.post('/:id/cancel',
  generalRateLimit,
  validateContentType(['application/json']),
  AppointmentController.cancelAppointment
);

/**
 * @swagger
 * /api/core/appointments/{id}/complete:
 *   post:
 *     tags: [Appointments]
 *     summary: Mark appointment as completed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               outcome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment completed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.post('/:id/complete',
  generalRateLimit,
  validateContentType(['application/json']),
  AppointmentController.completeAppointment
);

/**
 * @swagger
 * /api/core/appointments/{id}/reschedule:
 *   post:
 *     tags: [Appointments]
 *     summary: Reschedule appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *             required: [newScheduledAt]
 *             properties:
 *               newScheduledAt:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.post('/:id/reschedule',
  generalRateLimit,
  validateContentType(['application/json']),
  AppointmentController.rescheduleAppointment
);

// Lead-specific appointment routes
/**
 * @swagger
 * /api/core/appointments/lead/{leadId}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointments for a specific lead
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
 *         description: Lead appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 */
router.get('/lead/:leadId',
  generalRateLimit,
  AppointmentController.getLeadAppointments
);

/**
 * @swagger
 * /api/core/appointments/bulk:
 *   patch:
 *     tags: [Appointments]
 *     summary: Bulk update appointments (Admin/Manager only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentIds, updates]
 *             properties:
 *               appointmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *                   assignedTo:
 *                     type: string
 *     responses:
 *       200:
 *         description: Appointments updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager role required
 */
// Admin/Manager only routes
router.patch('/bulk',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  strictRateLimit,
  validateContentType(['application/json']),
  AppointmentController.bulkUpdateAppointments
);

export { router as appointmentRoutes };