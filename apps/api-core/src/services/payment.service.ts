import { Payment, Prisma } from '@prisma/client';
import { PaymentStatus, UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/middleware/logging';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { CreatePaymentLinkRequest, PaginatedResponse, PaginationParams } from '@/types';
import { LeadService } from './lead.service';
import { config } from '@/config';

/**
 * Payment with related data
 */
export interface PaymentWithRelations extends Payment {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string | null;
    status: string;
  };
}

/**
 * Payment filters
 */
export interface PaymentFilters {
  leadId?: string;
  status?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  currency?: string;
  search?: string;
}

/**
 * Payment link response
 */
export interface PaymentLinkResponse {
  id: string;
  paymentLink: string;
  amount: number;
  currency: string;
  description?: string;
  expiresAt: Date;
  status: PaymentStatus;
  createdAt: Date;
}

/**
 * Payment Service
 */
export class PaymentService {
  /**
   * Create a payment link for a lead
   */
  static async createPaymentLink(
    leadId: string,
    paymentData: CreatePaymentLinkRequest,
    createdBy: string,
    userRole: UserRole
  ): Promise<PaymentLinkResponse> {
    try {
      const { amount, currency = 'USD', description, expiresAt } = paymentData;

      // Check if lead exists and user has access
      const lead = await LeadService.getLeadById(leadId, createdBy, userRole);

      // Validate amount
      if (amount <= 0) {
        throw new BadRequestError('Payment amount must be greater than 0');
      }

      const maxAmount = 999999.99;
      if (amount > maxAmount) {
        throw new BadRequestError(`Payment amount cannot exceed ${maxAmount} ${currency}`);
      }

      // Validate currency
      const supportedCurrencies = ['USD', 'EUR', 'GBP', 'VND'];
      if (!supportedCurrencies.includes(currency)) {
        throw new BadRequestError(`Unsupported currency: ${currency}`);
      }

      // Calculate expiration date
      const expirationDate = expiresAt || (() => {
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        return defaultExpiry;
      })();

      // Generate payment link (stub implementation)
      const paymentLinkId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentLink = `${config.PAYMENT_SERVICE_URL}/pay/${paymentLinkId}`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          leadId,
          amount,
          currency,
          description,
          paymentLink,
          expiresAt: expirationDate,
          status: PaymentStatus.PENDING,
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
        },
      });

      // Update lead's last interaction timestamp
      await prisma.lead.update({
        where: { id: leadId },
        data: { updatedAt: new Date() },
      });

      logger.info('Payment link created successfully', {
        paymentId: payment.id,
        leadId,
        amount,
        currency,
        createdBy,
      });

      return {
        id: payment.id,
        paymentLink: payment.paymentLink,
        amount: Number(payment.amount),
        currency: payment.currency,
        description: payment.description || undefined,
        expiresAt: payment.expiresAt!,
        status: payment.status,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      logger.error('Create payment link error', {
        error: (error as Error).message,
        leadId,
        paymentData,
        createdBy,
      });
      throw error;
    }
  }

  /**
   * Get payments with pagination and filters
   */
  static async getPayments(
    filters: PaymentFilters,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<PaymentWithRelations>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { leadId, status, dateFrom, dateTo, amountFrom, amountTo, currency, search } = filters;

      // Build where clause
      const where: Prisma.PaymentWhereInput = {};

      // Role-based filtering
      if (userRole === UserRole.SALES) {
        // Sales users can only see payments for their own leads
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
            throw new ForbiddenError('You can only access payments for your own leads');
          }
        }
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Amount range filter
      if (amountFrom || amountTo) {
        where.amount = {};
        if (amountFrom) where.amount.gte = amountFrom;
        if (amountTo) where.amount.lte = amountTo;
      }

      // Currency filter
      if (currency) {
        where.currency = currency;
      }

      // Search filter
      if (search) {
        where.description = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.payment.count({ where });

      // Get payments
      const payments = await prisma.payment.findMany({
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
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: payments,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Get payments error', {
        error: (error as Error).message,
        filters,
        pagination,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(
    paymentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<PaymentWithRelations> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
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
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check access permissions
      if (userRole === UserRole.SALES) {
        // Sales users can only access payments for their own leads
        if (payment.lead?.ownerId !== userId) {
          throw new ForbiddenError('You can only access payments for your own leads');
        }
      }

      return payment;
    } catch (error) {
      logger.error('Get payment by ID error', {
        error: (error as Error).message,
        paymentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update payment status (webhook handler)
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
    paidAt?: Date
  ): Promise<PaymentWithRelations> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Validate status transition
      const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
        [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
        [PaymentStatus.PAID]: [], // Cannot change from paid
        [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // Can retry
        [PaymentStatus.CANCELLED]: [PaymentStatus.PENDING], // Can reactivate
      };

      const allowedStatuses = validTransitions[payment.status];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestError(
          `Cannot change payment status from ${payment.status} to ${status}`
        );
      }

      // Prepare update data
      const updateData: Prisma.PaymentUpdateInput = {
        status,
      };

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
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
        },
      });

      logger.info('Payment status updated', {
        paymentId,
        oldStatus: payment.status,
        newStatus: status,
        transactionId,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Update payment status error', {
        error: (error as Error).message,
        paymentId,
        status,
      });
      throw error;
    }
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(
    paymentId: string,
    cancelledBy: string,
    userRole: UserRole
  ): Promise<PaymentWithRelations> {
    try {
      // Check if payment exists and user has access
      const payment = await this.getPaymentById(paymentId, cancelledBy, userRole);

      // Only pending payments can be cancelled
      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestError('Only pending payments can be cancelled');
      }

      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatus.CANCELLED
      );

      logger.info('Payment cancelled', {
        paymentId,
        cancelledBy,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Cancel payment error', {
        error: (error as Error).message,
        paymentId,
        cancelledBy,
      });
      throw error;
    }
  }

  /**
   * Get payments for a specific lead
   */
  static async getLeadPayments(
    leadId: string,
    pagination: PaginationParams,
    userId: string,
    userRole: UserRole
  ): Promise<PaginatedResponse<PaymentWithRelations>> {
    try {
      // Check if user has access to this lead
      await LeadService.getLeadById(leadId, userId, userRole);

      return this.getPayments(
        { leadId },
        pagination,
        userId,
        userRole
      );
    } catch (error) {
      logger.error('Get lead payments error', {
        error: (error as Error).message,
        leadId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(
    userId: string,
    userRole: UserRole,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Record<PaymentStatus, { count: number; amount: number }>;
    byCurrency: Record<string, { count: number; amount: number }>;
    recentCount: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    try {
      // Build where clause based on role
      const where: Prisma.PaymentWhereInput = {};
      
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

      // Get total count and amount
      const totalStats = await prisma.payment.aggregate({
        where,
        _count: { id: true },
        _sum: { amount: true },
      });

      // Get counts and amounts by status
      const statusStats = await prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { amount: true },
      });

      // Get counts and amounts by currency
      const currencyStats = await prisma.payment.groupBy({
        by: ['currency'],
        where,
        _count: { currency: true },
        _sum: { amount: true },
      });

      // Get recent count (last 7 days)
      const recentCount = await prisma.payment.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get pending amount
      const pendingStats = await prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.PENDING,
        },
        _sum: { amount: true },
      });

      // Get paid amount
      const completedStats = await prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.PAID,
        },
        _sum: { amount: true },
      });

      // Format results
      const byStatus = Object.values(PaymentStatus).reduce((acc, status) => {
        const stat = statusStats.find(s => s.status === status);
        acc[status] = {
          count: stat?._count.status || 0,
          amount: Number(stat?._sum.amount) || 0,
        };
        return acc;
      }, {} as Record<PaymentStatus, { count: number; amount: number }>);

      const byCurrency = currencyStats.reduce((acc, stat) => {
        acc[stat.currency] = {
          count: stat._count.currency || 0,
          amount: Number(stat._sum.amount) || 0,
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      return {
        total: totalStats._count.id || 0,
        totalAmount: Number(totalStats._sum.amount) || 0,
        byStatus,
        byCurrency,
        recentCount,
        pendingAmount: Number(pendingStats._sum.amount) || 0,
        paidAmount: Number(completedStats._sum.amount) || 0,
      };
    } catch (error) {
      logger.error('Get payment stats error', {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get expired payment links
   */
  static async getExpiredPaymentLinks(): Promise<PaymentWithRelations[]> {
    try {
      const expiredPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
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
        },
      });

      return expiredPayments;
    } catch (error) {
      logger.error('Get expired payment links error', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Mark expired payments as failed
   */
  static async markExpiredPaymentsAsFailed(): Promise<number> {
    try {
      const result = await prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      logger.info('Marked expired payments as failed', {
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Mark expired payments as failed error', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Simulate payment completion (for testing)
   */
  static async simulatePaymentCompletion(
    paymentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<PaymentWithRelations> {
    try {
      // Check if payment exists and user has access
      const payment = await this.getPaymentById(paymentId, userId, userRole);

      // Only pending payments can be completed
      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestError('Only pending payments can be completed');
      }

      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatus.PAID,
        transactionId,
        new Date()
      );

      logger.info('Payment completion simulated', {
        paymentId,
        transactionId,
        userId,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Simulate payment completion error', {
        error: (error as Error).message,
        paymentId,
        userId,
      });
      throw error;
    }
  }
}