import { User, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/utils/jwt';
import { PasswordService } from '@/utils/password';
import { UnauthorizedError, BadRequestError, NotFoundError } from '@/utils/errors';
import { logger } from '@/middleware/logging';
import { LoginRequest, LoginResponse, CreateUserRequest, UpdateUserRequest } from '@/types';

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = loginData;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          password: true,

          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn('Login attempt with non-existent email', { email });
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn('Login attempt with inactive user', { userId: user.id, email });
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await PasswordService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', { userId: user.id, email });
        throw new UnauthorizedError('Invalid email or password');
      }

      // Note: lastLoginAt field removed from User model

      // Generate JWT token
      const token = JwtService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info('User logged in successfully', { userId: user.id, email });

      return {
        user: userWithoutPassword,
        accessToken: token,
        refreshToken: token, // TODO: Implement proper refresh token
        expiresIn: 3600, // 1 hour in seconds
      };
    } catch (error) {
      logger.error('Login error', { error: error instanceof Error ? error.message : String(error), email: loginData.email });
      throw error;
    }
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      return user as User;
    } catch (error) {
      logger.error('Get current user error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<User> {
    try {
      // Verify and decode token
      const decoded = JwtService.verifyToken(token);
      
      if (!decoded || !decoded.userId) {
        throw new UnauthorizedError('Invalid token');
      }

      // Get user from database
      const user = await this.getCurrentUser(decoded.userId);
      
      return user;
    } catch (error) {
      logger.error('Token verification error', { error: error instanceof Error ? error.message : String(error) });
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Create new user (admin only)
   */
  static async createUser(userData: CreateUserRequest, createdBy: string): Promise<User> {
    try {
      const { email, password, firstName, lastName, role = UserRole.SALES } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await PasswordService.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User created successfully', { 
        userId: user.id, 
        email: user.email, 
        createdBy 
      });

      return user as User;
    } catch (error) {
      logger.error('Create user error', { error: error instanceof Error ? error.message : String(error), email: userData.email });
      throw error;
    }
  }

  /**
   * Update user (admin/manager only)
   */
  static async updateUser(
    userId: string, 
    updateData: UpdateUserRequest, 
    updatedBy: string
  ): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prepare update data
      const updateFields: any = {};
      
      if (updateData.firstName !== undefined) {
        updateFields.firstName = updateData.firstName;
      }
      
      if (updateData.lastName !== undefined) {
        updateFields.lastName = updateData.lastName;
      }
      
      if (updateData.role !== undefined) {
        updateFields.role = updateData.role;
      }
      
      if (updateData.isActive !== undefined) {
        updateFields.isActive = updateData.isActive;
      }

      // Note: Password updates are handled separately via changePassword method

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateFields,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User updated successfully', { 
        userId: user.id, 
        updatedBy,
        updatedFields: Object.keys(updateFields)
      });

      return user as User;
    } catch (error) {
      logger.error('Update user error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Deactivate user (admin only)
   */
  static async deactivateUser(userId: string, deactivatedBy: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      logger.info('User deactivated successfully', { 
        userId, 
        deactivatedBy 
      });
    } catch (error) {
      logger.error('Deactivate user error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Activate user (admin only)
   */
  static async activateUser(userId: string, activatedBy: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      logger.info('User activated successfully', { 
        userId, 
        activatedBy 
      });
    } catch (error) {
      logger.error('Activate user error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Get all users (admin/manager only)
   */
  static async getAllUsers(filters?: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }): Promise<User[]> {
    try {
      const where: any = {};

      if (filters?.role) {
        where.role = filters.role;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,

          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return users as User[];
    } catch (error) {
      logger.error('Get all users error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user as User;
    } catch (error) {
      logger.error('Get user by ID error', { userId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await PasswordService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Change password error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Check if user has permission for action
   */
  static hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string, userRole: UserRole): Promise<any> {
    try {
      // For now, return basic stats
      // In a real implementation, this would aggregate data from various tables
      return {
        totalLogins: 0,
        lastLoginAt: null,
        accountAge: 0,
        activityCount: 0,
      };
    } catch (error) {
      logger.error('Get user stats error', { error: error instanceof Error ? error.message : String(error), userId });
      throw error;
    }
  }

  /**
   * Check if user can access resource
   */
  static canAccessResource(
    userRole: UserRole, 
    userId: string, 
    resourceOwnerId?: string
  ): boolean {
    // Admins can access everything
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Managers can access most resources
    if (userRole === UserRole.MANAGER) {
      return true;
    }

    // Sales users can only access their own resources
    if (userRole === UserRole.SALES) {
      return !resourceOwnerId || resourceOwnerId === userId;
    }

    return false;
  }

  /**
   * Bulk update users (admin/manager only)
   */
  static async bulkUpdateUsers(
    userIds: string[],
    updateData: UpdateUserRequest,
    updatedBy: string,
    updaterRole: UserRole
  ): Promise<{ successful: User[]; failed: Array<{ id: string; error: string }> }> {
    const successful: User[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        const updatedUser = await this.updateUser(userId, updateData, updatedBy);
        successful.push(updatedUser);
      } catch (error) {
        failed.push({
          id: userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Bulk user update completed', {
      totalUsers: userIds.length,
      successful: successful.length,
      failed: failed.length,
      updatedBy
    });

    return { successful, failed };
  }
}