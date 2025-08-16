import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { JwtService } from '@/utils/jwt';
import { ValidationService, changePasswordSchema, verifyTokenSchema, loginSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/error';
import { logger } from '@/middleware/logging';
import { AuthenticatedRequest } from '@/types';

/**
 * Auth Controller
 */
export class AuthController {
  /**
   * Login user
   * POST /api/core/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { email, password } = ValidationService.validateBody(
      loginSchema,
      req.body
    ) as { email: string; password: string };

    // Authenticate user
    const result = await AuthService.login({ email, password });

    // Log successful login
    logger.info('User logged in successfully', {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Set cache-control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          isActive: result.user.isActive,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
      message: 'Login successful',
    });
  });

  /**
   * Get current user
   * GET /api/core/auth/me
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Get current user data
    const user = await AuthService.getCurrentUser(userId);

    // Set cache-control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

      },
      message: 'User data retrieved successfully',
    });
  });

  /**
   * Refresh JWT token
   * POST /api/core/auth/refresh
   */
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Get current user and generate new token
    const user = await AuthService.getCurrentUser(userId);
    const token = JwtService.generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    });

    logger.info('Token refreshed successfully', {
      userId,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        user,
        accessToken: token,
        refreshToken: token,
        expiresIn: 3600,
      },
    });
  });

  /**
   * Logout user
   * POST /api/core/auth/logout
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    logger.info('User logged out', {
      userId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * Change password
   * POST /api/core/auth/change-password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    
    // Validate request body
    const { currentPassword, newPassword } = ValidationService.validateBody(
      changePasswordSchema,
      req.body
    ) as {
      currentPassword: string;
      newPassword: string;
    };

    // Change password
    await AuthService.changePassword(userId, currentPassword, newPassword);

    logger.info('Password changed successfully', {
      userId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Verify token
   * POST /api/core/auth/verify
   */
  static verifyToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = ValidationService.validateBody(
      verifyTokenSchema,
      req.body
    ) as { token: string };

    // Verify token
    const result = await AuthService.verifyToken(token);

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role,
          isActive: result.isActive,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
      message: 'Token verification completed',
    });
  });
}