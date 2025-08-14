import { Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import { AuthRequest } from '@/types';
import { UserRole } from '@prisma/client';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    // Verify token
    const payload = JwtService.verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },});

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtService.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = JwtService.verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.warn('Optional auth token error:', (error as Error).message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control helper
 */
export class RoleGuard {
  /**
   * Check if user can access resource
   */
  static canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Check if user can manage other users
   */
  static canManageUsers(userRole: UserRole): boolean {
    return (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER);
  }

  /**
   * Check if user can manage leads
   */
  static canManageLeads(userRole: UserRole): boolean {
    return (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER || userRole === UserRole.SALES);
  }

  /**
   * Check if user can view all leads or only owned leads
   */
  static canViewAllLeads(userRole: UserRole): boolean {
    return (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER);
  }

  /**
   * Check if user can assign leads to others
   */
  static canAssignLeads(userRole: UserRole): boolean {
    return (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER);
  }

  /**
   * Check if user can access lead (either owns it or has management permissions)
   */
  static canAccessLead(userRole: UserRole, userId: string, leadOwnerId?: string | null): boolean {
    // Admins and managers can access all leads
    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return true;
    }

    // Sales users can only access their own leads or unassigned leads
    if (userRole === UserRole.SALES) {
      return !leadOwnerId || leadOwnerId === userId;
    }

    // Support users can view but not modify
    return userRole === UserRole.SUPPORT;
  }

  /**
   * Check if user can modify lead
   */
  static canModifyLead(userRole: UserRole, userId: string, leadOwnerId?: string | null): boolean {
    // Support users cannot modify leads
    if (userRole === UserRole.SUPPORT) {
      return false;
    }

    return this.canAccessLead(userRole, userId, leadOwnerId);
  }
}

/**
 * Lead ownership middleware
 * Ensures user can access the requested lead
 */
export const checkLeadAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const leadId = req.params.id;
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, ownerId: true },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (!RoleGuard.canAccessLead(req.user.role, req.user.id, lead.ownerId)) {
      throw new ForbiddenError('You do not have permission to access this lead');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Lead modification middleware
 * Ensures user can modify the requested lead
 */
export const checkLeadModifyAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const leadId = req.params.id;
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, ownerId: true },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (!RoleGuard.canModifyLead(req.user.role, req.user.id, lead.ownerId)) {
      throw new ForbiddenError('You do not have permission to modify this lead');
    }

    next();
  } catch (error) {
    next(error);
  }
};