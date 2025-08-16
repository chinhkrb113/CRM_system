import { Response } from 'express';
import { ApiError } from '@/types';
import { ValidationError } from './validation';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, 400, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, true);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(message, 500, true, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable') {
    super(message, 503, true);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429, true);
  }
}

// Error response utility
export class ErrorHandler {
  /**
   * Send error response
   */
  static sendErrorResponse(res: Response, error: Error): void {
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    // Handle different error types
    if (error instanceof ValidationError) {
      statusCode = error.statusCode;
      errorCode = 'VALIDATION_ERROR';
      message = error.message;
      details = { errors: error.errors };
    } else if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorCode = error.name.replace('Error', '').toUpperCase();
      message = error.message;
      details = error.details;
    } else if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      statusCode = 400;
      errorCode = 'DATABASE_ERROR';
      
      switch (prismaError.code) {
        case 'P2002':
          message = 'A record with this information already exists';
          errorCode = 'DUPLICATE_RECORD';
          statusCode = 409;
          break;
        case 'P2025':
          message = 'Record not found';
          errorCode = 'NOT_FOUND';
          statusCode = 404;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          errorCode = 'FOREIGN_KEY_CONSTRAINT';
          break;
        default:
          message = 'Database operation failed';
      }
    } else if (error.name === 'PrismaClientValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Invalid data provided';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      errorCode = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    }

    const errorResponse: ApiError = {
      error: errorCode,
      message,
      statusCode,
      ...(details && { details }),
    };

    // Log error for debugging
    if (statusCode >= 500) {
      console.error('Server Error:', {
        error: error.message,
        stack: error.stack,
        statusCode,
        errorCode,
      });
    } else {
      console.warn('Client Error:', {
        error: error.message,
        statusCode,
        errorCode,
      });
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(statusCode: number, errorCode: string, message: string, details?: any): ApiError {
    return {
      error: errorCode,
      message,
      statusCode,
      ...(details && { details }),
    };
  }



  /**
   * Check if error is operational (expected) or programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

// Common error messages
export const ErrorMessages = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_REQUIRED: 'Authentication token is required',
  TOKEN_INVALID: 'Invalid authentication token',
  TOKEN_EXPIRED: 'Authentication token has expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_CREATION_FAILED: 'Failed to create user',

  // Lead
  LEAD_NOT_FOUND: 'Lead not found',
  LEAD_ALREADY_EXISTS: 'Lead with this email already exists',
  LEAD_CREATION_FAILED: 'Failed to create lead',
  LEAD_UPDATE_FAILED: 'Failed to update lead',

  // Interaction
  INTERACTION_NOT_FOUND: 'Interaction not found',
  INTERACTION_CREATION_FAILED: 'Failed to create interaction',

  // Appointment
  APPOINTMENT_NOT_FOUND: 'Appointment not found',
  APPOINTMENT_CREATION_FAILED: 'Failed to create appointment',
  APPOINTMENT_UPDATE_FAILED: 'Failed to update appointment',
  APPOINTMENT_PAST_DATE: 'Cannot schedule appointment in the past',

  // Payment
  PAYMENT_NOT_FOUND: 'Payment not found',
  PAYMENT_CREATION_FAILED: 'Failed to create payment link',
  PAYMENT_INVALID_AMOUNT: 'Invalid payment amount',

  // AI Service
  AI_SERVICE_UNAVAILABLE: 'AI scoring service is currently unavailable',
  AI_SERVICE_ERROR: 'Failed to calculate lead score',

  // General
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'An internal server error occurred',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};