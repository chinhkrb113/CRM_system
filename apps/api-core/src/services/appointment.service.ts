import { Appointment, Prisma } from '@prisma/client';
import { AppointmentStatus, UserRole, type AppointmentStatusType, type UserRoleType } from '@/constants/enums';
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
  status?: AppointmentStatusType;
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
    userRole: UserRoleType
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
    userRole: UserRoleType
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
          { title: { contains: search } },
          { description: { contains: search } },
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
    userRole: UserRoleType
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
    userRole: UserRoleType
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
        const validTransitions: Record<AppointmentStatusType, AppointmentStatusType[]> = {
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
    userRole: UserRoleType,
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
    userRole: UserRoleType
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
    userRole: UserRoleType,
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
    userRole: UserRoleType,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    upcomingToday: number;
    upcomingWeek: number;
    byStatus: Record<AppointmentStatusType, number>;
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

      // Get scheduled count
      const scheduled = await prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.SCHEDULED,
        },
      });

      // Get completed count
      const completed = await prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.COMPLETED,
        },
      });

      // Get cancelled count
      const cancelled = await prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.CANCELLED,
        },
      });

      // Get today's upcoming appointments
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const upcomingToday = await prisma.appointment.count({
        where: {
          ...where,
          scheduledAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: AppointmentStatus.SCHEDULED,
        },
      });

      // Get this week's upcoming appointments
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);
      
      const upcomingWeek = await prisma.appointment.count({
        where: {
          ...where,
          scheduledAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
          status: AppointmentStatus.SCHEDULED,
        },
      });

      // Format results
      const byStatus: Record<AppointmentStatusType, number> = {
        [AppointmentStatus.SCHEDULED]: statusCounts.find(s => s.status === AppointmentStatus.SCHEDULED)?._count.status || 0,
        [AppointmentStatus.COMPLETED]: statusCounts.find(s => s.status === AppointmentStatus.COMPLETED)?._count.status || 0,
        [AppointmentStatus.CANCELLED]: statusCounts.find(s => s.status === AppointmentStatus.CANCELLED)?._count.status || 0,
        [AppointmentStatus.NO_SHOW]: statusCounts.find(s => s.status === AppointmentStatus.NO_SHOW)?._count.status || 0,
      };

      return {
        total,
        scheduled,
        completed,
        cancelled,
        upcomingToday,
        upcomingWeek,
        byStatus,
      };
    } catch (error) {
      logger.error('Get appointment stats error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get calendar view of appointments
   */
  static async getCalendarView(
    userId: string,
    userRole: UserRoleType,
    year: number,
    month: number,
    view: 'month' | 'week' | 'day' | 'list' = 'month'
  ): Promise<{
    year: number;
    month: number;
    view: string;
    appointments: AppointmentWithRelations[];
    totalCount: number;
  }> {
    try {
      // Build where clause based on role
      const where: Prisma.AppointmentWhereInput = {};
      
      if (userRole === UserRole.SALES) {
        where.lead = {
          ownerId: userId,
        };
      }

      // Calculate date range based on view
      let startDate: Date;
      let endDate: Date;
      const today = new Date();

      if (view === 'month') {
        // Get full month
        startDate = new Date(year, month - 1, 1); // month is 0-indexed
        endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month
      } else if (view === 'week') {
        // Get current week of the specified month
        const currentDate = new Date(year, month - 1, today.getDate());
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Calculate start of week (Sunday)
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        
        // Calculate end of week (Saturday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'day') {
        // Get current day
        startDate = new Date(year, month - 1, today.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'list') {
        // List view: get full month like month view
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        // Default to month view
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      }

      // Add date range to where clause
      where.scheduledAt = {
        gte: startDate,
        lte: endDate,
      };

      // Get appointments with relations
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
        orderBy: {
          scheduledAt: 'asc',
        },
      });

      // Get total count
      const totalCount = await prisma.appointment.count({ where });

      return {
        year,
        month,
        view,
        appointments: appointments as AppointmentWithRelations[],
        totalCount,
      };
    } catch (error) {
      logger.error('Get calendar view error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        year,
        month,
        view,
      });
      throw error;
    }
  }
}