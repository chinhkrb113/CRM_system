import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationService, ValidationError } from '@/utils/validation';
import { AuthRequest } from '@/types';

/**
 * Validation middleware factory
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = ValidationService.validateBody(schema.body, req.body);
      }

      // Validate request parameters
      if (schema.params) {
        req.params = ValidationService.validateParams(schema.params, req.params);
      }

      // Validate request query
      if (schema.query) {
        req.query = ValidationService.validateQuery(schema.query, req.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Body validation middleware
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = ValidationService.validateBody(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Parameters validation middleware
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = ValidationService.validateParams(schema, req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Query validation middleware
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = ValidationService.validateQuery(schema, req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get('Content-Type');
    
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      const error = new ValidationError('Invalid content type', [
        {
          field: 'Content-Type',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          value: contentType,
        },
      ]);
      return next(error);
    }

    next();
  };
};

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSizeBytes: number = 1024 * 1024) => { // 1MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      const error = new ValidationError('Request too large', [
        {
          field: 'Content-Length',
          message: `Request size must not exceed ${maxSizeBytes} bytes`,
          value: contentLength,
        },
      ]);
      return next(error);
    }

    next();
  };
};

/**
 * Custom validation middleware for business rules
 */
export const validateBusinessRules = {
  /**
   * Validate appointment scheduling rules
   */
  appointmentScheduling: (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { scheduledAt } = req.body;
      
      if (scheduledAt) {
        const appointmentDate = new Date(scheduledAt);
        const now = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(now.getFullYear() + 1); // Max 1 year in future

        // Check if appointment is in the past
        if (appointmentDate <= now) {
          throw new ValidationError('Invalid appointment time', [
            {
              field: 'scheduledAt',
              message: 'Appointment cannot be scheduled in the past',
              value: scheduledAt,
            },
          ]);
        }

        // Check if appointment is too far in the future
        if (appointmentDate > maxFutureDate) {
          throw new ValidationError('Invalid appointment time', [
            {
              field: 'scheduledAt',
              message: 'Appointment cannot be scheduled more than 1 year in advance',
              value: scheduledAt,
            },
          ]);
        }

        // Check business hours (9 AM to 6 PM, Monday to Friday)
        const dayOfWeek = appointmentDate.getDay();
        const hour = appointmentDate.getHours();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
          throw new ValidationError('Invalid appointment time', [
            {
              field: 'scheduledAt',
              message: 'Appointments can only be scheduled on weekdays',
              value: scheduledAt,
            },
          ]);
        }

        if (hour < 9 || hour >= 18) {
          throw new ValidationError('Invalid appointment time', [
            {
              field: 'scheduledAt',
              message: 'Appointments can only be scheduled between 9 AM and 6 PM',
              value: scheduledAt,
            },
          ]);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate payment amount rules
   */
  paymentAmount: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { amount, currency } = req.body;
      
      if (amount !== undefined) {
        // Check minimum amount
        const minAmount = currency === 'USD' ? 1.00 : 1.00; // Minimum $1 or equivalent
        if (amount < minAmount) {
          throw new ValidationError('Invalid payment amount', [
            {
              field: 'amount',
              message: `Minimum payment amount is ${minAmount} ${currency}`,
              value: amount,
            },
          ]);
        }

        // Check maximum amount
        const maxAmount = 999999.99;
        if (amount > maxAmount) {
          throw new ValidationError('Invalid payment amount', [
            {
              field: 'amount',
              message: `Maximum payment amount is ${maxAmount} ${currency}`,
              value: amount,
            },
          ]);
        }

        // Check decimal places
        const decimalPlaces = (amount.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
          throw new ValidationError('Invalid payment amount', [
            {
              field: 'amount',
              message: 'Payment amount cannot have more than 2 decimal places',
              value: amount,
            },
          ]);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate lead assignment rules
   */
  leadAssignment: (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { ownerId } = req.body;
      const userRole = req.user?.role;

      // Only admins and managers can assign leads to others
      if (ownerId && userRole && !['ADMIN', 'MANAGER'].includes(userRole)) {
        // Sales users can only assign leads to themselves
        if (ownerId !== req.user?.id) {
          throw new ValidationError('Invalid lead assignment', [
            {
              field: 'ownerId',
              message: 'You can only assign leads to yourself',
              value: ownerId,
            },
          ]);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS characters
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};