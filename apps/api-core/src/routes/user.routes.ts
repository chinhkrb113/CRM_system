import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimit';
import { validateContentType } from '@/middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Rate limiting
const generalRateLimit = createRateLimit.general();
const strictRateLimit = createRateLimit.strict();

// All user routes require authentication
router.use(authenticate);

// Public user routes (accessible by all authenticated users)
/**
 * @swagger
 * /api/core/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user profile
 *     description: Get the current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [ADMIN, MANAGER, SALES, USER]
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/profile',
  generalRateLimit,
  UserController.getUserProfile
);

/**
 * @swagger
 * /api/core/users/profile:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update the current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile',
  generalRateLimit,
  validateContentType(['application/json']),
  UserController.updateUserProfile
);

/**
 * @swagger
 * /api/core/users/reset-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Reset password
 *     description: Reset the current authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: currentPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized
 */
router.post('/reset-password',
  strictRateLimit,
  validateContentType(['application/json']),
  UserController.resetPassword
);

// Admin and Manager routes
/**
 * @swagger
 * /api/core/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Get a paginated list of all users (Admin/Manager only)
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
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, SALES, USER]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in user name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           role:
 *                             type: string
 *                           isActive:
 *                             type: boolean
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
 *       403:
 *         description: Forbidden - Admin/Manager role required
 */
router.get('/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  UserController.getUsers
);

/**
 * @swagger
 * /api/core/users/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user statistics
 *     description: Get statistics about users (Admin/Manager only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                       example: 50
 *                     active:
 *                       type: integer
 *                       example: 45
 *                     inactive:
 *                       type: integer
 *                       example: 5
 *                     byRole:
 *                       type: object
 *                       properties:
 *                         ADMIN:
 *                           type: integer
 *                           example: 2
 *                         MANAGER:
 *                           type: integer
 *                           example: 5
 *                         SALES:
 *                           type: integer
 *                           example: 20
 *                         USER:
 *                           type: integer
 *                           example: 23
 *                     recentRegistrations:
 *                       type: integer
 *                       example: 8
 *                       description: Users registered in the last 30 days
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager role required
 */
router.get('/stats',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  UserController.getUserStats
);

/**
 * @swagger
 * /api/core/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Get a specific user by ID (Admin/Manager only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     phone:
 *                       type: string
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager role required
 *       404:
 *         description: User not found
 */
router.get('/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  UserController.getUserById
);

router.get('/:id/activity',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  generalRateLimit,
  UserController.getUserActivity
);

// Admin only routes
router.post('/',
  authorize(UserRole.ADMIN),
  strictRateLimit,
  validateContentType(['application/json']),
  UserController.createUser
);

router.patch('/:id',
  authorize(UserRole.ADMIN),
  generalRateLimit,
  validateContentType(['application/json']),
  UserController.updateUser
);

router.post('/:id/activate',
  authorize(UserRole.ADMIN),
  generalRateLimit,
  UserController.activateUser
);

router.post('/:id/deactivate',
  authorize(UserRole.ADMIN),
  generalRateLimit,
  UserController.deactivateUser
);

router.post('/:id/change-password',
  authorize(UserRole.ADMIN),
  strictRateLimit,
  validateContentType(['application/json']),
  UserController.changeUserPassword
);

router.patch('/bulk',
  authorize(UserRole.ADMIN),
  strictRateLimit,
  validateContentType(['application/json']),
  UserController.bulkUpdateUsers
);

export { router as userRoutes };