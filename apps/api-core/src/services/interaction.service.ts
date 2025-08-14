import { Interaction, Prisma, InteractionType, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/middleware/logging';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { CreateInteractionRequest, PaginatedResponse, PaginationParams } from '@/types';
import { LeadService } from './lead.service';

/**
 * Interaction with related data
 */
export interface InteractionWithRelations extends Interaction {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string | null;
    status: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Interaction filters
 */
export interface InteractionFilters {
  leadId?: string;
  userId?: string;
  type?: InteractionType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Interaction Service
 */
export class InteractionService {
  /**
   * Create a new interaction for a lead
   */
  static async createInteraction(
    leadId: string,
    interactionData: CreateInteractionRequest,
    createdBy: string,
    userRole: UserRole
  ): Promise<InteractionWithRelations> {
    try {
      const { type, subject, scheduledAt } = interactionData;

      // Check if lead exists and user has access
      const lead = await LeadService.getLeadById(leadId, createdBy, userRole);

      // Validate scheduled date for future interactions
      if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        const now = new Date();
        
        if (scheduledDate <= now) {
          throw new BadRequestError('Scheduled time must be in the future');
        }

        // Check if it's too far in the future (max 1 year)
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(now.getFullYear() + 1);
        
        if (scheduledDate > maxFutureDate) {
          throw new BadRequestError('Scheduled time cannot be more than 1 year in the future');
        }
      }

      // Create interaction
      const interaction = await prisma.interaction.create({
        data: {
          leadId,
          userId: createdBy,
          type,
          subject,
          scheduledAt,
        },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update lead's last interaction timestamp
      await prisma.lead.update({
        where: { id: leadId },
        data: { updatedAt: new Date() },
      });

      logger.info('Interaction created successfully', {
        interactionId: interaction.id,
        leadId,
        type,
        createdBy,
      });

      return interaction;
    } catch (error) {
      logger.error('Create interaction error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        interactionData,
        createdBy,
      });
      throw error;
    }
  }

  /**
   * Get interactions with pagination and filters
   */
  static async getInteractions(
    filters: InteractionFilters,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<InteractionWithRelations>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { leadId, userId: filterUserId, type, dateFrom, dateTo, search } = filters;

      // Build where clause
      const where: Prisma.InteractionWhereInput = {};

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        // Sales users can only see interactions for their own leads
        where.lead = {
          ownerId: userId,
        };
      }

      // Lead filter
      if (leadId) {
        where.leadId = leadId;
        
        // Check if user has access to this lead
        if (userRole === UserRole.SALES) {
          const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { ownerId: true },
          });
          
          if (!lead || lead.ownerId !== userId) {
            throw new ForbiddenError('You can only access interactions for your own leads');
          }
        }
      }

      // User filter
      if (filterUserId) {
        where.userId = filterUserId;
      }

      // Type filter
      if (type) {
        where.type = type;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Search filter
      if (search) {
        where.subject = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.interaction.count({ where });

      // Get interactions
      const interactions = await prisma.interaction.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { scheduledAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: interactions,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Get interactions error', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        pagination,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get interaction by ID
   */
  static async getInteractionById(
    interactionId: string,
    userId: string,
    userRole: UserRole
  ): Promise<InteractionWithRelations> {
    try {
      const interaction = await prisma.interaction.findUnique({
        where: { id: interactionId },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              status: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!interaction) {
        throw new NotFoundError('Interaction not found');
      }

      // Check access permissions
      if (userRole === UserRole.SALES) {
        // Sales users can only access interactions for their own leads
        if (interaction.lead?.ownerId !== userId) {
          throw new ForbiddenError('You can only access interactions for your own leads');
        }
      }

      return interaction;
    } catch (error) {
      logger.error('Get interaction by ID error', {
        error: error instanceof Error ? error.message : String(error),
        interactionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update interaction
   */
  static async updateInteraction(
    interactionId: string,
    updateData: Partial<CreateInteractionRequest>,
    updatedBy: string,
    userRole: UserRole
  ): Promise<InteractionWithRelations> {
    try {
      // Check if interaction exists and user has access
      const existingInteraction = await this.getInteractionById(interactionId, updatedBy, userRole);

      // Only the creator or admin/manager can update
      if (userRole === UserRole.SALES && existingInteraction.userId !== updatedBy) {
        throw new ForbiddenError('You can only update your own interactions');
      }

      // Validate scheduled date if being updated
      if (updateData.scheduledAt) {
        const scheduledDate = new Date(updateData.scheduledAt);
        const now = new Date();
        
        if (scheduledDate <= now) {
          throw new BadRequestError('Scheduled time must be in the future');
        }

        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(now.getFullYear() + 1);
        
        if (scheduledDate > maxFutureDate) {
          throw new BadRequestError('Scheduled time cannot be more than 1 year in the future');
        }
      }

      // Prepare update data
      const updateFields: Prisma.InteractionUpdateInput = {};
      
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.subject !== undefined) updateFields.subject = updateData.subject;
      if (updateData.scheduledAt !== undefined) updateFields.scheduledAt = updateData.scheduledAt;

      // Update interaction
      const interaction = await prisma.interaction.update({
        where: { id: interactionId },
        data: updateFields,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info('Interaction updated successfully', {
        interactionId,
        updatedBy,
        updatedFields: Object.keys(updateFields),
      });

      return interaction;
    } catch (error) {
      logger.error('Update interaction error', {
        error: error instanceof Error ? error.message : String(error),
        interactionId,
        updateData,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Delete interaction
   */
  static async deleteInteraction(
    interactionId: string,
    deletedBy: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      // Check if interaction exists and user has access
      const interaction = await this.getInteractionById(interactionId, deletedBy, userRole);

      // Only the creator, admin, or manager can delete
      if (userRole === UserRole.SALES && interaction.userId !== deletedBy) {
        throw new ForbiddenError('You can only delete your own interactions');
      }

      // Delete interaction
      await prisma.interaction.delete({
        where: { id: interactionId },
      });

      logger.info('Interaction deleted successfully', {
        interactionId,
        deletedBy,
      });
    } catch (error) {
      logger.error('Delete interaction error', {
        error: error instanceof Error ? error.message : String(error),
        interactionId,
        deletedBy,
      });
      throw error;
    }
  }

  /**
   * Get interactions for a specific lead
   */
  static async getLeadInteractions(
    leadId: string,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<InteractionWithRelations>> {
    try {
      // Check if user has access to this lead
      await LeadService.getLeadById(leadId, userId, userRole);

      return this.getInteractions(
        { leadId },
        pagination,
        userId,
        userRole
      );
    } catch (error) {
      logger.error('Get lead interactions error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get interaction statistics
   */
  static async getInteractionStats(
    userId: string,
    userRole: UserRole,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    byType: Record<InteractionType, number>;
    recentCount: number;
    scheduledCount: number;
  }> {
    try {
      // Build where clause based on role
      const where: Prisma.InteractionWhereInput = {};
      
      if (userRole === UserRole.SALES) {
        where.lead = {
          ownerId: userId,
        };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Get total count
      const total = await prisma.interaction.count({ where });

      // Get counts by type
      const typeCounts = await prisma.interaction.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      });

      // Get recent count (last 7 days)
      const recentCount = await prisma.interaction.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get scheduled count (future interactions)
      const scheduledCount = await prisma.interaction.count({
        where: {
          ...where,
          scheduledAt: {
            gt: new Date(),
          },
        },
      });

      // Format results
      const byType = Object.values(InteractionType).reduce((acc, type) => {
        acc[type] = typeCounts.find(t => t.type === type)?._count.type || 0;
        return acc;
      }, {} as Record<InteractionType, number>);

      return {
        total,
        byType,
        recentCount,
        scheduledCount,
      };
    } catch (error) {
      logger.error('Get interaction stats error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get upcoming scheduled interactions
   */
  static async getUpcomingInteractions(
    userId: string,
    userRole: UserRole,
    limit: number = 10
  ): Promise<InteractionWithRelations[]> {
    try {
      const where: Prisma.InteractionWhereInput = {
        scheduledAt: {
          gt: new Date(),
        },
      };

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        where.lead = {
          ownerId: userId,
        };
      }

      const interactions = await prisma.interaction.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
      });

      return interactions;
    } catch (error) {
      logger.error('Get upcoming interactions error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}