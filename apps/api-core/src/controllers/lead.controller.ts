import { Response } from 'express';
import Joi from 'joi';
import { LeadService } from '@/services/lead.service';
import { ValidationService, createLeadSchema, uuidParamSchema, updateLeadSchema, updateLeadPutSchema, updateLeadScoreSchema, dateRangeQuerySchema, assignLeadSchema, paginationQuerySchema, bulkUpdateLeadsSchema, leadFiltersSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/error';
import { logger } from '@/middleware/logging';
import { AuthenticatedRequest } from '@/types';
import { LeadStatus, LeadSource } from '@prisma/client';

/**
 * Lead Controller
 */
export class LeadController {
  /**
   * Get leads with pagination and filters
   * GET /api/core/leads
   */
  static getLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      leadFiltersSchema,
      req.query
    ) as any;

    // Extract pagination parameters
    const pagination = {
      page: queryData.page || 1,
      limit: queryData.limit || 10,
    };

    // Extract filters
    const filters = {
      status: queryData.status as LeadStatus,
      source: queryData.source as LeadSource,
      ownerId: queryData.ownerId,
      search: queryData.q,
      dateFrom: queryData.dateFrom ? new Date(queryData.dateFrom) : undefined,
      dateTo: queryData.dateTo ? new Date(queryData.dateTo) : undefined,
      scoreMin: queryData.scoreMin,
      scoreMax: queryData.scoreMax,
    };

    // Get leads
    const result = await LeadService.getLeads(
      filters,
      pagination,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Leads retrieved successfully',
    });
  });

  /**
   * Create a new lead
   * POST /api/core/leads
   */
  static createLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate request body
    const leadData = ValidationService.validateBody(
      createLeadSchema,
      req.body
    ) as any;

    // Create lead
    const lead = await LeadService.createLead(leadData, userId, userRole);

    logger.info('Lead created successfully', {
      leadId: lead.id,
      createdBy: userId,
      leadEmail: lead.email,
      company: lead.company,
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
    });
  });

  /**
   * Get lead by ID
   * GET /api/core/leads/:id
   */
  static getLeadById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Get lead
    const lead = await LeadService.getLeadById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead retrieved successfully',
    });
  });

  /**
   * Update lead
   * PATCH /api/core/leads/:id
   */
  static updateLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    const updateData = ValidationService.validateBody(
       updateLeadPutSchema,
       req.body
     ) as any;

    // Update lead
    const lead = await LeadService.updateLead(id, updateData, userId, userRole);

    logger.info('Lead updated successfully', {
      leadId: id,
      updatedBy: userId,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    });
  });

  /**
   * Update lead (PUT method)
   * PUT /api/core/leads/:id
   */
  static updateLeadPut = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    const updateData = ValidationService.validateBody(
       updateLeadPutSchema,
       req.body
     ) as any;

    // Update lead
    const lead = await LeadService.updateLead(id, updateData, userId, userRole);

    logger.info('Lead updated successfully (PUT)', {
      leadId: id,
      updatedBy: userId,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    });
  });

  /**
   * Delete lead (hard delete)
   * DELETE /api/core/leads/:id
   */
  static deleteLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Delete lead
    await LeadService.deleteLead(id, userId, userRole);

    logger.info('Lead deleted successfully', {
      leadId: id,
      deletedBy: userId,
    });

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
    });
  });

  /**
   * Update lead score
   * PATCH /api/core/leads/:id/score
   */
  static updateLeadScore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    const { score } = ValidationService.validateBody(
       updateLeadScoreSchema,
       req.body
     ) as { score: number };

    // Update lead score
    const lead = await LeadService.updateLeadScore(id, score, userId);

    logger.info('Lead score updated successfully', {
      leadId: id,
      newScore: score,
      updatedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead score updated successfully',
    });
  });

  /**
   * Update lead status
   * PUT /api/core/leads/:id/status
   */
  static updateLeadStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Validate request body
    const { status } = ValidationService.validateBody(
      Joi.object({
        status: Joi.string().valid(...Object.values(LeadStatus)).required()
      }),
      req.body
    ) as { status: LeadStatus };

    logger.info('Updating lead status', {
      leadId: id,
      newStatus: status,
      updatedBy: userId,
    });

    // Update lead status
    const lead = await LeadService.updateLeadStatus(
      id,
      status as LeadStatus,
      userId,
      userRole
    );

    logger.info('Lead status updated successfully', {
      leadId: id,
      newStatus: status,
      updatedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead status updated successfully',
    });
  });

  /**
   * Get lead statistics
   * GET /api/core/leads/stats
   */
  static getLeadStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate query parameters
    const queryData = ValidationService.validateQuery(
      leadFiltersSchema,
      req.query
    ) as any;

    const dateFrom = queryData.dateFrom ? new Date(queryData.dateFrom) : undefined;
    const dateTo = queryData.dateTo ? new Date(queryData.dateTo) : undefined;

    // Get lead statistics
    const stats = await LeadService.getLeadStats(
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Lead statistics retrieved successfully',
    });
  });

  /**
   * Assign lead to user
   * POST /api/core/leads/:id/assign
   */
  static assignLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    const { ownerId } = ValidationService.validateBody(
       assignLeadSchema,
       req.body
     ) as { ownerId: string };

    // Assign lead
    const lead = await LeadService.updateLead(
      id,
      { ownerId },
      userId,
      userRole
    );

    logger.info('Lead assigned successfully', {
      leadId: id,
      newOwnerId: ownerId,
      assignedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    });
  });

  /**
   * Convert lead to customer
   * POST /api/core/leads/:id/convert
   */
  static convertLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate parameters
    const { id } = ValidationService.validateParams(
      uuidParamSchema,
      req.params
    ) as { id: string };

    // Convert lead to customer
    const lead = await LeadService.updateLead(
      id,
      { status: 'CLOSED_WON' },
      userId,
      userRole
    );

    logger.info('Lead converted successfully', {
      leadId: id,
      convertedBy: userId,
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead converted successfully',
    });
  });

  // TODO: Implement getLeadTimeline method in LeadService
  // static getLeadTimeline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  //   // Implementation pending
  // });

  // TODO: Implement bulkUpdateLeads method in LeadService
  // static bulkUpdateLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  //   // Implementation pending
  // });

  // TODO: Implement exportLeads method in LeadService
  // static exportLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  //   // Implementation pending
  // });
}