import { Lead, Prisma, LeadStatus, LeadSource, UserRole, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { logger } from '@/middleware/logging';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/utils/errors';
import { 
  CreateLeadRequest, 
  UpdateLeadRequest, 
  LeadFilters, 
  PaginatedResponse,
  PaginationParams 
} from '@/types';

/**
 * Lead with related data
 */
export interface LeadWithRelations extends Lead {
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  interactions?: {
    id: string;
    type: string;
    subject: string;
    createdAt: Date;
  }[];
  appointments?: {
    id: string;
    title: string;
    scheduledAt: Date;
    status: string;
  }[];
  payments?: {
    id: string;
    amount: Decimal;
    currency: string;
    status: string;
    createdAt: Date;
  }[];
}

/**
 * Lead Service
 */
export class LeadService {
  /**
   * Create a new lead
   */
  static async createLead(
    leadData: CreateLeadRequest,
    createdBy: string,
    userRole: UserRole
  ): Promise<LeadWithRelations> {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        source = LeadSource.WEBSITE,
        notes,
      } = leadData;

      // Set default status and ownerId
      const status = LeadStatus.NEW;
      const ownerId = undefined; // Will be set based on user role below

      // Validate owner assignment
      let finalOwnerId: string | undefined = ownerId;
      if (ownerId) {
        // Check if the specified owner exists and is active
        const owner = await prisma.user.findUnique({
          where: { id: ownerId, isActive: true },
        });

        if (!owner) {
          throw new BadRequestError('Specified owner not found or inactive');
        }

        // Check permissions for assigning to others
        if (ownerId !== createdBy && !['ADMIN', 'MANAGER'].includes(userRole)) {
          throw new ForbiddenError('You can only assign leads to yourself');
        }
      } else {
        // Auto-assign to creator if no owner specified
        finalOwnerId = createdBy;
      }

      // Check for duplicate email
      if (email) {
        const existingLead = await prisma.lead.findFirst({
          where: { email: email.toLowerCase() },
        });

        if (existingLead) {
          throw new BadRequestError('Lead with this email already exists');
        }
      }

      // Create lead
      const lead = await prisma.lead.create({
        data: {
          firstName,
          lastName,
          email: email?.toLowerCase(),
          phone,
          company,
          source,
          status,
          ownerId: finalOwnerId,
          notes,
          score: 0, // Default score
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          interactions: {
            select: {
              id: true,
              type: true,
              subject: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Latest 5 interactions
          },
          appointments: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5, // Latest 5 appointments
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Latest 5 payments
          },
        },
      });

      logger.info('Lead created successfully', {
        leadId: lead.id,
        email: lead.email,
        createdBy,
        ownerId: finalOwnerId,
      });

      return lead;
    } catch (error) {
      logger.error('Create lead error', {
        error: error instanceof Error ? error.message : String(error),
        leadData: { ...leadData, email: leadData.email },
        createdBy,
      });
      throw error;
    }
  }

  /**
   * Get leads with pagination and filters
   */
  static async getLeads(
    filters: LeadFilters,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<LeadWithRelations>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { status, source, assignedTo, search } = filters;

      // Build where clause
      const where: Prisma.LeadWhereInput = {};

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        // Sales users can only see their own leads
        where.ownerId = userId;
      } else if (assignedTo) {
        // Managers and admins can filter by owner
        where.ownerId = assignedTo;
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Source filter
      if (source) {
        where.source = source;
      }

      // Search filter
      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.lead.count({ where });

      // Get leads
      const leads = await prisma.lead.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          interactions: {
            select: {
              id: true,
              type: true,
              subject: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 3, // Latest 3 interactions for list view
          },
          appointments: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
            },
            where: {
              scheduledAt: { gte: new Date() }, // Only future appointments
            },
            orderBy: { scheduledAt: 'asc' },
            take: 2, // Next 2 appointments
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1, // Latest payment
          },
        },
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: leads,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Get leads error', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        pagination,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get lead by ID
   */
  static async getLeadById(
    leadId: string,
    userId: string,
    userRole: UserRole
  ): Promise<LeadWithRelations> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          interactions: {
            select: {
              id: true,
              type: true,
              subject: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          appointments: {
            select: {
              id: true,
              title: true,
              description: true,
              scheduledAt: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { scheduledAt: 'desc' },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              description: true,
              paymentLink: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!lead) {
        throw new NotFoundError('Lead not found');
      }

      // Check access permissions
      if (userRole === UserRole.SALES && lead.ownerId !== userId) {
        throw new ForbiddenError('You can only access your own leads');
      }

      return lead;
    } catch (error) {
      logger.error('Get lead by ID error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update lead
   */
  static async updateLead(
    leadId: string,
    updateData: UpdateLeadRequest,
    updatedBy: string,
    userRole: UserRole
  ): Promise<LeadWithRelations> {
    try {
      // Check if lead exists and user has access
      const existingLead = await this.getLeadById(leadId, updatedBy, userRole);

      // Validate owner assignment
      if (updateData.ownerId && updateData.ownerId !== existingLead.ownerId) {
        // Check if the new owner exists and is active
        const newOwner = await prisma.user.findUnique({
          where: { id: updateData.ownerId, isActive: true },
        });

        if (!newOwner) {
          throw new BadRequestError('Specified owner not found or inactive');
        }

        // Check permissions for reassigning
        if (!['ADMIN', 'MANAGER'].includes(userRole)) {
          throw new ForbiddenError('You cannot reassign leads');
        }
      }

      // Check for duplicate email if email is being updated
      if (updateData.email && updateData.email !== existingLead.email) {
        const duplicateLead = await prisma.lead.findFirst({
          where: {
            email: updateData.email.toLowerCase(),
            id: { not: leadId },
          },
        });

        if (duplicateLead) {
          throw new BadRequestError('Lead with this email already exists');
        }
      }

      // Prepare update data
      const updateFields: Prisma.LeadUpdateInput = {};
      
      if (updateData.firstName !== undefined) updateFields.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) updateFields.lastName = updateData.lastName;
      if (updateData.email !== undefined) updateFields.email = updateData.email.toLowerCase();
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.company !== undefined) updateFields.company = updateData.company;
      if (updateData.source !== undefined) updateFields.source = updateData.source;
      if (updateData.status !== undefined) updateFields.status = updateData.status;
      if (updateData.ownerId !== undefined) {
        updateFields.owner = updateData.ownerId ? {
          connect: { id: updateData.ownerId }
        } : {
          disconnect: true
        };
      }
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
      if (updateData.score !== undefined) updateFields.score = updateData.score;

      // Update lead
      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: updateFields,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          interactions: {
            select: {
              id: true,
              type: true,
              subject: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          appointments: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5,
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      logger.info('Lead updated successfully', {
        leadId,
        updatedBy,
        updatedFields: Object.keys(updateFields),
      });

      return lead;
    } catch (error) {
      logger.error('Update lead error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        updateData,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Delete lead (soft delete)
   */
  static async deleteLead(
    leadId: string,
    deletedBy: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      // Check if lead exists and user has access
      await this.getLeadById(leadId, deletedBy, userRole);

      // Only admins can delete leads
      if (userRole !== UserRole.ADMIN) {
        throw new ForbiddenError('Only administrators can delete leads');
      }

      // Hard delete - permanently remove from database
      await prisma.lead.delete({
        where: { id: leadId },
      });

      logger.info('Lead permanently deleted from database', {
        leadId,
        deletedBy,
      });
    } catch (error) {
      logger.error('Delete lead error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        deletedBy,
      });
      throw error;
    }
  }

  /**
   * Update lead score
   */
  static async updateLeadScore(
    leadId: string,
    score: number,
    updatedBy: string
  ): Promise<Lead> {
    try {
      // Validate score range
      if (score < 0 || score > 100) {
        throw new BadRequestError('Score must be between 0 and 100');
      }

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: { score },
      });

      logger.info('Lead score updated', {
        leadId,
        score,
        updatedBy,
      });

      return lead;
    } catch (error) {
      logger.error('Update lead score error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        score,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Update lead status
   */
  static async updateLeadStatus(
    leadId: string,
    status: LeadStatus,
    updatedBy: string,
    userRole: UserRole
  ): Promise<LeadWithRelations> {
    try {
      // Check if lead exists and user has permission
      const existingLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!existingLead) {
        throw new NotFoundError('Lead not found');
      }

      // Check permissions
      if (userRole === UserRole.SALES && existingLead.ownerId !== updatedBy) {
        throw new ForbiddenError('You can only update leads assigned to you');
      }

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: { 
          status,
          updatedAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          interactions: {
            select: {
              id: true,
              type: true,
              subject: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          appointments: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5,
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      logger.info('Lead status updated', {
        leadId,
        status,
        updatedBy,
      });

      return lead;
    } catch (error) {
      logger.error('Update lead status error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        status,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Get lead statistics
   */
  static async getLeadStats(
    userId: string,
    userRole: UserRole
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentlyCreated: number;
    averageScore: number;
  }> {
    try {
      // Build where clause based on role
      const where: Prisma.LeadWhereInput = {};
      if (userRole === UserRole.SALES) {
        where.ownerId = userId;
      }

      // Get total count
      const total = await prisma.lead.count({ where });

      // Get counts by status
      const statusCounts = await prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      });

      // Get counts by source
      const sourceCounts = await prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: { source: true },
      });

      // Get recently created count (last 7 days)
      const recentlyCreated = await prisma.lead.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get average score
      const scoreAggregate = await prisma.lead.aggregate({
        where,
        _avg: { score: true },
      });

      // Format results
      const byStatus = Object.values(LeadStatus).reduce((acc, status) => {
        acc[status] = statusCounts.find(s => s.status === status)?._count.status || 0;
        return acc;
      }, {} as Record<LeadStatus, number>);

      const bySource = Object.values(LeadSource).reduce((acc, source) => {
        acc[source] = sourceCounts.find(s => s.source === source)?._count.source || 0;
        return acc;
      }, {} as Record<LeadSource, number>);

      return {
        total,
        byStatus,
        bySource,
        recentlyCreated,
        averageScore: scoreAggregate._avg.score || 0,
      };
    } catch (error) {
      logger.error('Get lead stats error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}