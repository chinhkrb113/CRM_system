import { Appointment, Prisma } from '@prisma/client';
import { AppointmentStatus, UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/middleware/logging';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { CreateAppointmentRequest, UpdateAppointmentRequest, PaginatedResponse, PaginationParams } from '@/types';
import { LeadService } from './lead.service';

/**
 * Appointment with related data
 */
export interface AppointmentWithRelations extends Appointment {
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
 * Appointment filters
 */
export interface AppointmentFilters {
  leadId?: string;
  userId?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Appointment Service
 */
export class AppointmentService {
  /**
   * Create a new appointment for a lead
   */
  static async createAppointment(
    leadId: string,
    appointmentData: CreateAppointmentRequest,
    createdBy: string,
    userRole: UserRole
  ): Promise<AppointmentWithRelations> {
    try {
      const { title, description, scheduledAt } = appointmentData;

      // Check if lead exists and user has access
      const lead = await LeadService.getLeadById(leadId, createdBy, userRole);

      // Validate scheduled date
      const appointmentDate = new Date(scheduledAt);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new BadRequestError('Appointment cannot be scheduled in the past');
      }

      // Check if appointment is too far in the future (max 1 year)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + 1);
      
      if (appointmentDate > maxFutureDate) {
        throw new BadRequestError('Appointment cannot be scheduled more than 1 year in advance');
      }

      // Validate business hours (9 AM to 6 PM, Monday to Friday)
      const dayOfWeek = appointmentDate.getDay();
      const hour = appointmentDate.getHours();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
        throw new BadRequestError('Appointments can only be scheduled on weekdays');
      }

      if (hour < 9 || hour >= 18) {
        throw new BadRequestError('Appointments can only be scheduled between 9 AM and 6 PM');
      }

      // Check for scheduling conflicts
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          userId: createdBy,
          scheduledAt: {
            gte: new Date(appointmentDate.getTime() - 30 * 60 * 1000), // 30 minutes before
            lte: new Date(appointmentDate.getTime() + 30 * 60 * 1000), // 30 minutes after
          },
          status: {
            in: [AppointmentStatus.SCHEDULED],
          },
        },
      });

      if (conflictingAppointment) {
        throw new BadRequestError('You have a conflicting appointment at this time');
      }

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          leadId,
          userId: createdBy,
          title,
          description,
          scheduledAt: appointmentDate,
          status: AppointmentStatus.SCHEDULED,
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

      logger.info('Appointment created successfully', {
        appointmentId: appointment.id,
        leadId,
        scheduledAt: appointmentDate.toISOString(),
        createdBy,
      });

      return appointment;
    } catch (error) {
      logger.error('Create appointment error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        appointmentData,
        createdBy,
      });
      throw error;
    }
  }

  /**
   * Get appointments with pagination and filters
   */
  static async getAppointments(
    filters: AppointmentFilters,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { leadId, userId: filterUserId, status, dateFrom, dateTo, search } = filters;

      // Build where clause
      const where: Prisma.AppointmentWhereInput = {};

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        // Sales users can only see appointments for their own leads
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
            throw new ForbiddenError('You can only access appointments for your own leads');
          }
        }
      }

      // User filter
      if (filterUserId) {
        where.userId = filterUserId;
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.scheduledAt = {};
        if (dateFrom) where.scheduledAt.gte = dateFrom;
        if (dateTo) where.scheduledAt.lte = dateTo;
      }

      // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.appointment.count({ where });

      // Get appointments
      const appointments = await prisma.appointment.findMany({
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
          { scheduledAt: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: appointments,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Get appointments error', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        pagination,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(
    appointmentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<AppointmentWithRelations> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      // Check access permissions
      if (userRole === UserRole.SALES) {
        // Sales users can only access appointments for their own leads
        if (appointment.lead?.ownerId !== userId) {
          throw new ForbiddenError('You can only access appointments for your own leads');
        }
      }

      return appointment;
    } catch (error) {
      logger.error('Get appointment by ID error', {
        error: error instanceof Error ? error.message : String(error),
        appointmentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update appointment
   */
  static async updateAppointment(
    appointmentId: string,
    updateData: UpdateAppointmentRequest,
    updatedBy: string,
    userRole: UserRole
  ): Promise<AppointmentWithRelations> {
    try {
      // Check if appointment exists and user has access
      const existingAppointment = await this.getAppointmentById(appointmentId, updatedBy, userRole);

      // Only the creator or admin/manager can update
      if (userRole === UserRole.SALES && existingAppointment.userId !== updatedBy) {
        throw new ForbiddenError('You can only update your own appointments');
      }

      // Validate scheduled date if being updated
      if (updateData.scheduledAt) {
        const appointmentDate = new Date(updateData.scheduledAt);
        const now = new Date();
        
        if (appointmentDate <= now) {
          throw new BadRequestError('Appointment cannot be scheduled in the past');
        }

        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(now.getFullYear() + 1);
        
        if (appointmentDate > maxFutureDate) {
          throw new BadRequestError('Appointment cannot be scheduled more than 1 year in advance');
        }

        // Validate business hours
        const dayOfWeek = appointmentDate.getDay();
        const hour = appointmentDate.getHours();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          throw new BadRequestError('Appointments can only be scheduled on weekdays');
        }

        if (hour < 9 || hour >= 18) {
          throw new BadRequestError('Appointments can only be scheduled between 9 AM and 6 PM');
        }

        // Check for scheduling conflicts (excluding current appointment)
        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            userId: updatedBy,
            id: { not: appointmentId },
            scheduledAt: {
              gte: new Date(appointmentDate.getTime() - 30 * 60 * 1000),
              lte: new Date(appointmentDate.getTime() + 30 * 60 * 1000),
            },
            status: {
              in: [AppointmentStatus.SCHEDULED],
            },
          },
        });

        if (conflictingAppointment) {
          throw new BadRequestError('You have a conflicting appointment at this time');
        }
      }

      // Validate status transitions
      if (updateData.status && updateData.status !== existingAppointment.status) {
        const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
          [AppointmentStatus.SCHEDULED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
          [AppointmentStatus.COMPLETED]: [], // Cannot change from completed
          [AppointmentStatus.CANCELLED]: [AppointmentStatus.SCHEDULED], // Can reschedule
          [AppointmentStatus.NO_SHOW]: [AppointmentStatus.SCHEDULED], // Can reschedule
        };

        const allowedStatuses = validTransitions[existingAppointment.status];
        if (!allowedStatuses.includes(updateData.status)) {
          throw new BadRequestError(
            `Cannot change appointment status from ${existingAppointment.status} to ${updateData.status}`
          );
        }
      }

      // Prepare update data
      const updateFields: Prisma.AppointmentUpdateInput = {};
      
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.scheduledAt !== undefined) updateFields.scheduledAt = updateData.scheduledAt;
      if (updateData.status !== undefined) updateFields.status = updateData.status;

      // Update appointment
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
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

      logger.info('Appointment updated successfully', {
        appointmentId,
        updatedBy,
        updatedFields: Object.keys(updateFields),
      });

      return appointment;
    } catch (error) {
      logger.error('Update appointment error', {
        error: error instanceof Error ? error.message : String(error),
        appointmentId,
        updateData,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(
    appointmentId: string,
    cancelledBy: string,
    userRole: UserRole,
    reason?: string
  ): Promise<AppointmentWithRelations> {
    try {
      // First get the existing appointment
      const existingAppointment = await this.getAppointmentById(appointmentId, cancelledBy, userRole);
      
      const appointment = await this.updateAppointment(
        appointmentId,
        { 
          status: AppointmentStatus.CANCELLED,
          description: reason ? `${existingAppointment.description || ''}\n\nCancellation reason: ${reason}` : existingAppointment.description || undefined
        },
        cancelledBy,
        userRole
      );

      logger.info('Appointment cancelled', {
        appointmentId,
        cancelledBy,
        reason,
      });

      return appointment;
    } catch (error) {
      logger.error('Cancel appointment error', {
        error: error instanceof Error ? error.message : String(error),
        appointmentId,
        cancelledBy,
      });
      throw error;
    }
  }

  /**
   * Get appointments for a specific lead
   */
  static async getLeadAppointments(
    leadId: string,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      // Check if user has access to this lead
      await LeadService.getLeadById(leadId, userId, userRole);

      return this.getAppointments(
        { leadId },
        pagination,
        userId,
        userRole
      );
    } catch (error) {
      logger.error('Get lead appointments error', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcomingAppointments(
    userId: string,
    userRole: UserRole,
    limit: number = 10
  ): Promise<AppointmentWithRelations[]> {
    try {
      const where: Prisma.AppointmentWhereInput = {
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          in: [AppointmentStatus.SCHEDULED],
        },
      };

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        where.lead = {
          ownerId: userId,
        };
      }

      const appointments = await prisma.appointment.findMany({
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

      return appointments;
    } catch (error) {
      logger.error('Get upcoming appointments error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(
    userId: string,
    userRole: UserRole,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    byStatus: Record<AppointmentStatus, number>;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
  }> {
    try {
      // Build where clause based on role
      const where: Prisma.AppointmentWhereInput = {};
      
      if (userRole === UserRole.SALES) {
        where.lead = {
          ownerId: userId,
        };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.scheduledAt = {};
        if (dateFrom) where.scheduledAt.gte = dateFrom;
        if (dateTo) where.scheduledAt.lte = dateTo;
      }

      // Get total count
      const total = await prisma.appointment.count({ where });

      // Get counts by status
      const statusCounts = await prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      });

      // Get upcoming count
      const upcomingCount = await prisma.appointment.count({
        where: {
          ...where,
          scheduledAt: { gte: new Date() },
          status: AppointmentStatus.SCHEDULED,
        },
      });

      // Get completed count
      const completedCount = await prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.COMPLETED,
        },
      });

      // Get cancelled count
      const cancelledCount = await prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.CANCELLED,
        },
      });

      // Format results
      const byStatus = Object.values(AppointmentStatus).reduce((acc, status) => {
        acc[status] = statusCounts.find(s => s.status === status)?._count.status || 0;
        return acc;
      }, {} as Record<AppointmentStatus, number>);

      return {
        total,
        byStatus,
        upcomingCount,
        completedCount,
        cancelledCount,
      };
    } catch (error) {
      logger.error('Get appointment stats error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}