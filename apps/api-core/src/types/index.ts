import { Request } from 'express';
import { User, Lead, Interaction, Appointment, Payment } from '@prisma/client';
import { UserRole, LeadStatus, LeadSource, InteractionType, AppointmentStatus, PaymentStatus } from '@prisma/client';

/**
 * Authentication Types
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * User Types
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  recentlyCreated: number;
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Common Types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Lead Types
/**
 * Lead Types
 */
export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateLeadRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus;
  source?: LeadSource;
  ownerId?: string;
  score?: number;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface LeadStats {
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsBySource: Record<LeadSource, number>;
  averageScore: number;
  conversionRate: number;
  recentLeads: number;
}

export interface AssignLeadRequest {
  assignedTo: string;
}

export interface ConvertLeadRequest {
  notes?: string;
}

export interface BulkUpdateLeadsRequest {
  leadIds: string[];
  updateData: UpdateLeadRequest;
}

/**
 * Interaction Types
 */
export interface CreateInteractionRequest {
  leadId: string;
  type: InteractionType;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export interface UpdateInteractionRequest {
  type?: InteractionType;
  subject?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  completedAt?: Date;
}

export interface InteractionFilters {
  leadId?: string;
  type?: InteractionType;
  userId?: string;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  completed?: boolean;
  followUpRequired?: boolean;
}

export interface InteractionStats {
  totalInteractions: number;
  interactionsByType: Record<InteractionType, number>;
  completedInteractions: number;
  pendingFollowUps: number;
  averageDuration: number;
}

export interface CompleteInteractionRequest {
  outcome: string;
  duration?: number;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export interface RescheduleInteractionRequest {
  scheduledAt: Date;
  reason?: string;
}

export interface BulkCreateInteractionsRequest {
  interactions: CreateInteractionRequest[];
}

/**
 * Appointment Types
 */
export interface CreateAppointmentRequest {
  leadId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  meetingType: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'OTHER';
  reminderMinutes?: number;
}

export interface UpdateAppointmentRequest {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'OTHER';
  status?: AppointmentStatus;
  reminderMinutes?: number;
}

export interface AppointmentFilters {
  leadId?: string;
  status?: AppointmentStatus;
  userId?: string;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  meetingType?: string;
}

export interface AppointmentStats {
  totalAppointments: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  upcomingAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  averageDuration: number;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface CompleteAppointmentRequest {
  notes?: string;
  outcome?: string;
  followUpRequired?: boolean;
}

export interface RescheduleAppointmentRequest {
  scheduledAt: Date;
  reason?: string;
}

export interface CheckAvailabilityRequest {
  date: string;
  duration: number;
  userId?: string;
}

export interface BulkUpdateAppointmentsRequest {
  appointmentIds: string[];
  updateData: UpdateAppointmentRequest;
}

/**
 * Payment Types
 */
export interface CreatePaymentLinkRequest {
  leadId: string;
  amount: number;
  currency: string;
  description: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentFilters {
  leadId?: string;
  status?: PaymentStatus;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaymentStats {
  total: number;
  totalAmount: number;
  byStatus: Record<PaymentStatus, { count: number; amount: number }>;
  byCurrency: Record<string, { count: number; amount: number }>;
  recentCount: number;
  pendingAmount: number;
  paidAmount: number;
}

export interface ProcessPaymentRequest {
  paymentMethodId: string;
  billingDetails?: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export interface PaymentWebhookPayload {
  eventType: string;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * AI Types
 */
export interface AIScoreRequest {
  leadData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source: LeadSource;
    customFields?: Record<string, any>;
  };
  interactionHistory?: {
    totalInteractions: number;
    lastInteractionDate?: Date;
    interactionTypes: InteractionType[];
  };
}

export interface AIScoreResponse {
  score: number;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
  nextBestAction?: string;
}

export interface BatchScoreRequest {
  leadIds: string[];
}

export interface BatchScoreResponse {
  results: {
    leadId: string;
    score?: AIScoreResponse;
    error?: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface AIInsightsRequest {
  leadId: string;
  includeRecommendations?: boolean;
}

export interface AIInsightsResponse {
  leadId: string;
  insights: {
    category: string;
    insight: string;
    confidence: number;
  }[];
  recommendations?: {
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  }[];
  predictedOutcome?: {
    outcome: string;
    probability: number;
  };
}

export interface AIFeedbackRequest {
  leadId: string;
  predictedScore: number;
  actualOutcome: 'CONVERTED' | 'LOST' | 'ONGOING';
  feedback: string;
  accuracy: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface ActivityLogEntry {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Rate Limiting Types
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Logging Types
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

export interface SecurityLogEntry {
  type: 'SUSPICIOUS_ACTIVITY' | 'FAILED_LOGIN' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Export/Import Types
 */
export interface ExportOptions {
  format: 'CSV' | 'XLSX' | 'JSON';
  fields?: string[];
  filters?: Record<string, any>;
  includeDeleted?: boolean;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: {
    row: number;
    field?: string;
    message: string;
  }[];
}

/**
 * System Health Types
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    ai: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    payment: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  version: string;
  uptime: number;
}

/**
 * Environment Config
 */
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  AI_SERVICE_URL: string;
  AI_SERVICE_API_KEY: string;
  PAYMENT_SERVICE_URL: string;
  PAYMENT_WEBHOOK_SECRET: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  BCRYPT_ROUNDS: number;
  MAX_FILE_SIZE: string;
}

// Export Prisma types
export {
  LeadStatus,
  LeadSource,
  InteractionType,
  AppointmentStatus,
  PaymentStatus,
} from '@prisma/client';