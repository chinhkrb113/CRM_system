import { Response } from 'express';
import { PaymentService } from '@/services/payment.service';
import { ValidationService, leadIdParamSchema, createPaymentLinkSchema, paginationQuerySchema, uuidParamSchema, updatePaymentStatusSchema, dateRangeQuerySchema, linkIdParamSchema, processPaymentSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/error';
import { logger } from '@/middleware/logging';
import { AuthenticatedRequest, CreatePaymentLinkRequest } from '@/types';
import { PaymentStatus } from '@prisma/client';

/**
 * Payment Controller
 */
export class PaymentController {
  /**
   * Create payment link for a lead
   * POST /api/core/leads/:leadId/payment-link
   */
  static createPaymentLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Validate request body
    const paymentData = ValidationService.validateBody(
      createPaymentLinkSchema,
      req.body
    ) as CreatePaymentLinkRequest;

    // Create payment link
    const paymentLink = await PaymentService.createPaymentLink(
      leadId,
      paymentData,
      userId,
      userRole
    );

    logger.info('Payment link created successfully', {
      paymentId: paymentLink.id,
      leadId,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: paymentLink,
      message: 'Payment link created successfully',
    });
  });

  /**
   * Get payments with pagination and filters
   * GET /api/core/payments
   */
  static getPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      paginationQuerySchema,
      req.query
    ) as Record<string, any>;

    // Extract pagination parameters
    const pagination = {
      page: queryData.page || 1,
      limit: queryData.limit || 10,
    };

    // Extract filters
    const filters = {
      leadId: queryData.leadId,
      status: queryData.status as PaymentStatus,
      dateFrom: queryData.dateFrom ? new Date(queryData.dateFrom) : undefined,
      dateTo: queryData.dateTo ? new Date(queryData.dateTo) : undefined,
      amountFrom: queryData.amountFrom ? parseFloat(queryData.amountFrom) : undefined,
      amountTo: queryData.amountTo ? parseFloat(queryData.amountTo) : undefined,
      currency: queryData.currency,
      search: queryData.q,
    };

    // Get payments
    const result = await PaymentService.getPayments(
      filters,
      pagination,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Payments retrieved successfully',
    });
  });

  /**
   * Get payments for a specific lead
   * GET /api/core/leads/:leadId/payments
   */
  static getLeadPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      paginationQuerySchema,
      req.query
    ) as Record<string, any>;

    const pagination = {
      page: queryData.page || 1,
      limit: queryData.limit || 10,
    };

    // Get lead payments
    const result = await PaymentService.getLeadPayments(
      leadId,
      pagination,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Lead payments retrieved successfully',
    });
  });

  /**
   * Get payment by ID
   * GET /api/core/payments/:id
   */
  static getPaymentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Get payment
    const payment = await PaymentService.getPaymentById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    });
  });

  /**
   * Update payment status (webhook handler)
   * POST /api/core/payments/:id/status
   */
  static updatePaymentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Validate request body
    const { status, transactionId, paidAt } = ValidationService.validateBody(
      updatePaymentStatusSchema,
      req.body
    ) as Record<string, any>;

    // Update payment status
    const payment = await PaymentService.updatePaymentStatus(
      id,
      status,
      transactionId,
      paidAt ? new Date(paidAt) : undefined
    );

    logger.info('Payment status updated via webhook', {
      paymentId: id,
      newStatus: status,
      transactionId,
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully',
    });
  });

  /**
   * Cancel payment
   * POST /api/core/payments/:id/cancel
   */
  static cancelPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Cancel payment
    const payment = await PaymentService.cancelPayment(id, userId, userRole);

    logger.info('Payment cancelled successfully', {
      paymentId: id,
      cancelledBy: userId,
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment cancelled successfully',
    });
  });

  /**
   * Get payment statistics
   * GET /api/core/payments/stats
   */
  static getPaymentStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      dateRangeQuerySchema,
      req.query
    ) as Record<string, any>;

    const dateFrom = queryData.dateFrom ? new Date(queryData.dateFrom) : undefined;
    const dateTo = queryData.dateTo ? new Date(queryData.dateTo) : undefined;

    // Get payment statistics
    const stats = await PaymentService.getPaymentStats(
      userId,
      userRole,
      dateFrom,
      dateTo
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Payment statistics retrieved successfully',
    });
  });

  /**
   * Get expired payment links
   * GET /api/core/payments/expired
   */
  static getExpiredPaymentLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get expired payment links
    const expiredPayments = await PaymentService.getExpiredPaymentLinks();

    res.status(200).json({
      success: true,
      data: expiredPayments,
      message: 'Expired payment links retrieved successfully',
    });
  });

  /**
   * Mark expired payments as failed
   * POST /api/core/payments/mark-expired
   */
  static markExpiredPaymentsAsFailed = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Mark expired payments as failed
    const count = await PaymentService.markExpiredPaymentsAsFailed();

    logger.info('Expired payments marked as failed', {
      count,
      triggeredBy: req.user!.id,
    });

    res.status(200).json({
      success: true,
      data: { count },
      message: `${count} expired payments marked as failed`,
    });
  });

  /**
   * Simulate payment completion (for testing)
   * POST /api/core/payments/:id/simulate-completion
   */
  static simulatePaymentCompletion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Simulate payment completion
    const payment = await PaymentService.simulatePaymentCompletion(id, userId, userRole);

    logger.info('Payment completion simulated', {
      paymentId: id,
      simulatedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment completion simulated successfully',
    });
  });

  /**
   * Resend payment link
   * POST /api/core/payments/:id/resend
   */
  static resendPaymentLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Get payment to check access
    const payment = await PaymentService.getPaymentById(id, userId, userRole);

    // Only pending payments can be resent
    if (payment.status !== PaymentStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be resent',
      });
    }

    logger.info('Payment link resent', {
      paymentId: id,
      resentBy: userId,
      leadEmail: payment.lead?.email,
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentLink: payment.paymentLink,
        expiresAt: payment.expiresAt,
      },
      message: 'Payment link resent successfully',
    });
  });

  /**
   * Get payment link details (public endpoint)
   * GET /api/core/payments/link/:linkId
   */
  static getPaymentLinkDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate parameters
    const { linkId } = ValidationService.validateParams(
      linkIdParamSchema,
      req.params
    ) as { linkId: string };

    // This would typically be a public endpoint that doesn't require authentication
    // For now, we'll return basic payment link information
    res.status(200).json({
      success: true,
      data: {
        linkId,
        status: 'active',
        message: 'Payment link is valid',
      },
      message: 'Payment link details retrieved successfully',
    });
  });

  /**
   * Process payment (public endpoint for payment gateway)
   * POST /api/core/payments/process
   */
  static processPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate request body
    const { paymentId, amount, currency, paymentMethod } = ValidationService.validateBody(
      processPaymentSchema,
      req.body
    ) as Record<string, any>;

    // This would typically integrate with a payment gateway
    // For now, we'll simulate the payment processing
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update payment status to paid
    const payment = await PaymentService.updatePaymentStatus(
      paymentId,
      PaymentStatus.PAID,
      transactionId,
      new Date()
    );

    logger.info('Payment processed successfully', {
      paymentId,
      transactionId,
      amount,
      currency,
      paymentMethod,
    });

    res.status(200).json({
      success: true,
      data: {
        transactionId,
        status: PaymentStatus.PAID,
        amount: payment.amount,
        currency: payment.currency,
        updatedAt: payment.updatedAt,
      },
      message: 'Payment processed successfully',
    });
  });
}