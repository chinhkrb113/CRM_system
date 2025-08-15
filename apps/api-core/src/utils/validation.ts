import Joi from 'joi';
import { UserRole, LeadStatus, LeadSource, InteractionType, AppointmentStatus, PaymentStatus } from '@/constants/enums';

// Common schemas
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });
const emailSchema = Joi.string().email().max(255);
const phoneSchema = Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).message('Phone number must be in international format');
const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

// Auth validation schemas
export const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().min(1).required(),
});

// User validation schemas
export const createUserSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.SALES),
});

export const updateUserSchema = Joi.object({
  email: emailSchema,
  firstName: Joi.string().min(2).max(100),
  lastName: Joi.string().min(2).max(100),
  role: Joi.string().valid(...Object.values(UserRole)),
  isActive: Joi.boolean(),
}).min(1);

export const bulkUpdateUsersSchema = Joi.object({
  userIds: Joi.array().items(uuidSchema).min(1).max(50).required(),
  updateData: updateUserSchema.required(),
});

export const resetPasswordSchema = Joi.object({
  email: emailSchema.required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

export const verifyTokenSchema = Joi.object({
  token: Joi.string().min(1).required(),
});

// Lead validation schemas
export const createLeadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: emailSchema.required(),
  phone: phoneSchema.required(),
  source: Joi.string().valid(...Object.values(LeadSource)).required(),
  notes: Joi.string().max(1000).allow('', null),
});

export const updateLeadSchema = Joi.object({
  status: Joi.string().valid(...Object.values(LeadStatus)),
  ownerId: uuidSchema.allow(null),
  notes: Joi.string().max(1000).allow('', null),
}).min(1);

export const leadFiltersSchema = Joi.object({
  ...paginationSchema,
  status: Joi.string().valid(...Object.values(LeadStatus)),
  source: Joi.string().valid(...Object.values(LeadSource)),
  q: Joi.string().max(100), // search query
});

export const updateLeadScoreSchema = Joi.object({
  score: Joi.number().integer().min(0).max(100).required(),
});

export const assignLeadSchema = Joi.object({
  ownerId: uuidSchema.required(),
});

export const bulkUpdateLeadsSchema = Joi.object({
  leadIds: Joi.array().items(uuidSchema).min(1).max(50).required(),
  updateData: updateLeadSchema.required(),
});

// Interaction validation schemas
export const createInteractionSchema = Joi.object({
  type: Joi.string().valid(...Object.values(InteractionType)).required(),
  content: Joi.string().min(1).max(2000).required(),
});

export const updateInteractionSchema = Joi.object({
  type: Joi.string().valid(...Object.values(InteractionType)),
  content: Joi.string().min(1).max(2000),
  scheduledAt: Joi.date().iso().min('now'),
  notes: Joi.string().max(1000).allow('', null),
}).min(1);

export const interactionFiltersSchema = Joi.object({
  ...paginationSchema,
  leadId: uuidSchema,
  type: Joi.string().valid(...Object.values(InteractionType)),
  userId: uuidSchema,
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  q: Joi.string().max(100), // search query
});

export const completeInteractionSchema = Joi.object({
  notes: Joi.string().max(1000).allow('', null),
  outcome: Joi.string().max(500).allow('', null),
});

export const rescheduleInteractionSchema = Joi.object({
  scheduledAt: Joi.date().iso().min('now').required(),
  notes: Joi.string().max(500).allow('', null),
});

export const bulkCreateInteractionsSchema = Joi.object({
  interactions: Joi.array().items(createInteractionSchema).min(1).max(50).required(),
});

export const interactionIdParamSchema = Joi.object({
  id: uuidSchema.required(),
});

// Appointment validation schemas
export const createAppointmentSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow('', null),
  scheduledAt: Joi.date().iso().min('now').required(),
});

export const updateAppointmentSchema = Joi.object({
  status: Joi.string().valid(...Object.values(AppointmentStatus)).required(),
});

export const appointmentFiltersSchema = Joi.object({
  ...paginationSchema,
  leadId: uuidSchema,
  status: Joi.string().valid(...Object.values(AppointmentStatus)),
  type: Joi.string().max(100),
  userId: uuidSchema,
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  q: Joi.string().max(100), // search query
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null),
});

export const completeAppointmentSchema = Joi.object({
  notes: Joi.string().max(1000).allow('', null),
  outcome: Joi.string().max(500).allow('', null),
});

export const rescheduleAppointmentSchema = Joi.object({
  scheduledAt: Joi.date().iso().min('now').required(),
  reason: Joi.string().max(500).allow('', null),
});

export const checkAvailabilitySchema = Joi.object({
  scheduledAt: Joi.date().iso().min('now').required(),
  duration: Joi.number().integer().min(15).max(480).default(60), // 15 minutes to 8 hours
});

export const calendarViewSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030),
  month: Joi.number().integer().min(1).max(12),
  view: Joi.string().valid('month', 'week', 'day').default('month'),
});

export const bulkUpdateAppointmentsSchema = Joi.object({
  appointmentIds: Joi.array().items(uuidSchema).min(1).max(50).required(),
  updateData: updateAppointmentSchema.required(),
});

export const appointmentIdParamSchema = Joi.object({
  id: uuidSchema.required(),
});

// Payment validation schemas
export const createPaymentLinkSchema = Joi.object({
  amount: Joi.number().positive().precision(2).max(999999.99).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  description: Joi.string().max(500).allow('', null),
});

export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAID', 'FAILED', 'CANCELLED').required(),
  transactionId: Joi.string().max(255),
  paidAt: Joi.date().iso(),
});

export const processPaymentSchema = Joi.object({
  paymentId: uuidSchema.required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).uppercase().required(),
  paymentMethod: Joi.string().max(100).required(),
});

export const linkIdParamSchema = Joi.object({
  linkId: Joi.string().required(),
});

// Parameter validation schemas
export const uuidParamSchema = Joi.object({
  id: uuidSchema.required(),
});

export const leadIdParamSchema = Joi.object({
  leadId: uuidSchema.required(),
});

// Query validation schemas
export const paginationQuerySchema = Joi.object(paginationSchema);

export const aiRecommendationsQuerySchema = Joi.object({
  type: Joi.string().valid('general', 'lead_scoring', 'follow_up', 'conversion').default('general'),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const dateRangeQuerySchema = Joi.object({
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

// AI validation schemas
export const aiFeedbackSchema = Joi.object({
  leadId: uuidSchema.required(),
  actualOutcome: Joi.string().valid('converted', 'lost', 'pending').required(),
  feedback: Joi.string().max(1000).allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
});

// Validation helper functions
export class ValidationService {
  /**
   * Validate request body
   */
  static validateBody<T>(schema: Joi.ObjectSchema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      throw new ValidationError('Validation failed', validationErrors);
    }

    return value as T;
  }

  /**
   * Validate request parameters
   */
  static validateParams<T>(schema: Joi.ObjectSchema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      throw new ValidationError('Parameter validation failed', validationErrors);
    }

    return value as T;
  }

  /**
   * Validate request query
   */
  static validateQuery<T>(schema: Joi.ObjectSchema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      throw new ValidationError('Query validation failed', validationErrors);
    }

    return value as T;
  }
}

// Custom validation error class
export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(message: string, errors: Array<{ field: string; message: string; value?: any }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}