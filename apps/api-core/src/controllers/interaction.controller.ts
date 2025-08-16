import { Response } from 'express';
import { InteractionService } from '@/services/interaction.service';
import { ValidationService, createInteractionSchema, updateInteractionSchema, interactionFiltersSchema, completeInteractionSchema, rescheduleInteractionSchema, bulkCreateInteractionsSchema, interactionIdParamSchema, leadIdParamSchema, paginationQuerySchema, dateRangeQuerySchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/error';
import { logger } from '@/middleware/logging';
import { AuthenticatedRequest } from '@/types';
import { InteractionType } from '@prisma/client';

/**
 * Interaction Controller
 */
export class InteractionController {
  /**
   * Create interaction for a lead
   * POST /api/core/leads/:leadId/interactions
   */
  static createInteraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Validate request body
    const interactionData = ValidationService.validateBody(
      createInteractionSchema,
      req.body
    ) as any;

    // Create interaction
    const interaction = await InteractionService.createInteraction(
      leadId,
      interactionData,
      userId,
      userRole
    );

    logger.info('Interaction created successfully', {
      interactionId: interaction.id,
      leadId,
      type: interaction.type,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: interaction,
      message: 'Interaction created successfully',
    });
  });

  /**
   * Get interactions with pagination and filters
   * GET /api/core/interactions
   */
  static getInteractions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      interactionFiltersSchema,
      req.query
    ) as { leadId?: string; type?: string; userId?: string; dateFrom?: string; dateTo?: string; q?: string; page?: number; limit?: number };

    // Extract pagination parameters
    const pagination = {
      page: queryData.page || 1,
      limit: queryData.limit || 10,
    };

    // Extract filters
    const filters = {
      leadId: queryData.leadId,
      type: queryData.type as InteractionType,
      userId: queryData.userId,
      dateFrom: queryData.dateFrom ? new Date(queryData.dateFrom) : undefined,
      dateTo: queryData.dateTo ? new Date(queryData.dateTo) : undefined,
      search: queryData.q,
    };

    // Get interactions
    const result = await InteractionService.getInteractions(
      filters,
      pagination,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Interactions retrieved successfully',
    });
  });

  /**
   * Get interactions for a specific lead
   * GET /api/core/leads/:leadId/interactions
   */
  static getLeadInteractions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
    ) as { page?: number; limit?: number };

    const pagination = {
      page: queryData.page || 1,
      limit: queryData.limit || 10,
    };

    // Get lead interactions
    const result = await InteractionService.getLeadInteractions(
      leadId,
      pagination,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Lead interactions retrieved successfully',
    });
  });

  /**
   * Get interaction by ID
   * GET /api/core/interactions/:id
   */
  static getInteractionById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      interactionIdParamSchema,
      req.params
    ) as { id: string };

    // Get interaction
    const interaction = await InteractionService.getInteractionById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: interaction,
      message: 'Interaction retrieved successfully',
    });
  });

  /**
   * Update interaction
   * PATCH /api/core/interactions/:id
   */
  static updateInteraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      interactionIdParamSchema,
      req.params
    ) as { id: string };

    // Validate request body
    const updateData = ValidationService.validateBody(
      updateInteractionSchema,
      req.body
    ) as any;

    // Update interaction
    const interaction = await InteractionService.updateInteraction(
      id,
      updateData,
      userId,
      userRole
    );

    logger.info('Interaction updated successfully', {
      interactionId: id,
      updatedBy: userId,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: interaction,
      message: 'Interaction updated successfully',
    });
  });

  /**
   * Delete interaction
   * DELETE /api/core/interactions/:id
   */
  static deleteInteraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      interactionIdParamSchema,
      req.params
    ) as { id: string };

    // Delete interaction
    await InteractionService.deleteInteraction(id, userId, userRole);

    logger.info('Interaction deleted successfully', {
      interactionId: id,
      deletedBy: userId,
    });

    res.status(200).json({
      success: true,
      message: 'Interaction deleted successfully',
    });
  });

  /**
   * Get interaction statistics
   * GET /api/core/interactions/stats
   */
  static getInteractionStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      dateRangeQuerySchema,
      req.query
    ) as { dateFrom?: string; dateTo?: string };

    const dateFrom = queryData.dateFrom ? new Date(queryData.dateFrom) : undefined;
    const dateTo = queryData.dateTo ? new Date(queryData.dateTo) : undefined;

    // Get interaction statistics
    const stats = await InteractionService.getInteractionStats(
      userId,
      userRole,
      dateFrom,
      dateTo
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Interaction statistics retrieved successfully',
    });
  });

  /**
   * Get upcoming scheduled interactions
   * GET /api/core/interactions/upcoming
   */
  static getUpcomingInteractions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      paginationQuerySchema,
      req.query
    ) as { page?: number; limit?: number };

    const limit = queryData.limit || 10;

    // Get upcoming interactions
    const result = await InteractionService.getUpcomingInteractions(
      userId,
      userRole,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Upcoming interactions retrieved successfully',
    });
  });

  /**
   * Mark interaction as completed
   * POST /api/core/interactions/:id/complete
   */
  static completeInteraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      interactionIdParamSchema,
      req.params
    ) as { id: string };

    // Validate request body (optional completion notes)
    const { notes, outcome } = ValidationService.validateBody(
      completeInteractionSchema,
      req.body
    ) as { notes?: string; outcome?: string };

    // Update interaction as completed
    const updateData: any = {
      completedAt: new Date(),
    };

    if (notes) updateData.notes = notes;
    if (outcome) updateData.outcome = outcome;

    const interaction = await InteractionService.updateInteraction(
      id,
      updateData,
      userId,
      userRole
    );

    logger.info('Interaction marked as completed', {
      interactionId: id,
      completedBy: userId,
      outcome,
    });

    res.status(200).json({
      success: true,
      data: interaction,
      message: 'Interaction marked as completed',
    });
  });

  /**
   * Reschedule interaction
   * POST /api/core/interactions/:id/reschedule
   */
  static rescheduleInteraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      interactionIdParamSchema,
      req.params
    ) as { id: string };

    // Validate request body
    const { scheduledAt, notes } = ValidationService.validateBody(
      rescheduleInteractionSchema,
      req.body
    ) as { scheduledAt: string; notes?: string };

    // Update interaction schedule
    const updateData: any = {
      scheduledAt: new Date(scheduledAt),
    };

    if (notes) updateData.notes = notes;

    const interaction = await InteractionService.updateInteraction(
      id,
      updateData,
      userId,
      userRole
    );

    logger.info('Interaction rescheduled', {
      interactionId: id,
      newScheduledAt: scheduledAt,
      rescheduledBy: userId,
    });

    res.status(200).json({
      success: true,
      data: interaction,
      message: 'Interaction rescheduled successfully',
    });
  });

  /**
   * Bulk create interactions
   * POST /api/core/interactions/bulk
   */
  // static bulkCreateInteractions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  //   const userId = req.user!.id;
  //   const userRole = req.user!.role;

  //   // Validate request body
  //   const { interactions } = ValidationService.validateBody(
  //     bulkCreateInteractionsSchema,
  //     req.body
  //   ) as { interactions: any[] };

  //   // Bulk create interactions
  //   const result = await InteractionService.bulkCreateInteractions(
  //     interactions,
  //     userId,
  //     userRole
  //   );

  //   logger.info('Bulk interaction creation completed', {
  //     createdBy: userId,
  //     successCount: result.successful.length,
  //     failedCount: result.failed.length,
  //   });

  //   res.status(201).json({
  //     success: true,
  //     data: result,
  //     message: 'Bulk interaction creation completed',
  //   });
  // });

  /**
   * Get interaction summary for a lead
   * GET /api/core/leads/:leadId/interactions/summary
   */
  static getLeadInteractionSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { leadId } = ValidationService.validateParams(
      leadIdParamSchema,
      req.params
    ) as { leadId: string };

    // Get interaction summary (using getLeadInteractions for now)
    const summary = await InteractionService.getLeadInteractions(
      leadId,
      { page: 1, limit: 100 },
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Lead interaction summary retrieved successfully',
    });
  });
}