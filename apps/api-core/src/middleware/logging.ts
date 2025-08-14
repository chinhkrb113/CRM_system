import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { config } from '@/config';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Log entry interface
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Logger class
 */
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (config.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, meta, requestId, userId, ip, userAgent } = entry;
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (requestId) logMessage += ` | RequestID: ${requestId}`;
    if (userId) logMessage += ` | UserID: ${userId}`;
    if (ip) logMessage += ` | IP: ${ip}`;
    if (userAgent) logMessage += ` | UserAgent: ${userAgent}`;
    
    if (meta && Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>, req?: Request): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    if (req) {
      entry.requestId = req.headers['x-request-id'] as string;
      entry.userId = (req as AuthRequest).user?.id;
      entry.ip = req.ip;
      entry.userAgent = req.get('User-Agent');
    }

    const formattedLog = this.formatLog(entry);

    // In production, you might want to use a proper logging library like Winston
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  error(message: string, meta?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.ERROR, message, meta, req);
  }

  warn(message: string, meta?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.WARN, message, meta, req);
  }

  info(message: string, meta?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.INFO, message, meta, req);
  }

  debug(message: string, meta?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.DEBUG, message, meta, req);
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Request ID generator
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request ID middleware
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const existingRequestId = req.headers['x-request-id'] as string;
  const requestId = existingRequestId || generateRequestId();
  
  req.headers['x-request-id'] = requestId;
  res.set('X-Request-ID', requestId);
  
  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  const userId = (req as AuthRequest).user?.id;
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: sanitizeBody(req.body),
    headers: sanitizeHeaders(req.headers),
  }, req);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Outgoing response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(body).length,
      body: sanitizeResponseBody(body),
    }, req);

    return originalJson.call(this, body);
  };

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Outgoing response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: typeof body === 'string' ? body.length : JSON.stringify(body).length,
    }, req);

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    method: req.method,
    url: req.url,
    body: sanitizeBody(req.body),
    query: req.query,
    params: req.params,
  }, req);

  next(error);
};

/**
 * Audit logging middleware
 */
export const auditLogger = (action: string, resource?: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Log the action
    logger.info('Audit log', {
      action,
      resource,
      userId,
      userRole,
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: sanitizeBody(req.body),
    }, req);

    next();
  };
};

/**
 * Performance logging middleware
 */
export const performanceLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          memoryUsage: {
            heapUsed: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
            heapTotal: `${endMemory.heapTotal / 1024 / 1024}MB`,
            external: `${endMemory.external / 1024 / 1024}MB`,
          },
        }, req);
      }
    });

    next();
  };
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(<script[^>]*>.*?<\/script>)/gi, // XSS
    /(union.*select|select.*from|insert.*into|delete.*from|drop.*table)/gi, // SQL Injection
    /(\.\.\/|\.\.\\\/)/g, // Path traversal
    /(eval\(|setTimeout\(|setInterval\()/gi, // Code injection
  ];

  const checkForSuspiciousContent = (obj: any, path: string = ''): void => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          logger.warn('Suspicious content detected', {
            pattern: pattern.toString(),
            content: obj.substring(0, 100), // First 100 chars
            path,
            method: req.method,
            url: req.url,
          }, req);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForSuspiciousContent(value, path ? `${path}.${key}` : key);
      }
    }
  };

  // Check request body
  if (req.body) {
    checkForSuspiciousContent(req.body, 'body');
  }

  // Check query parameters
  if (req.query) {
    checkForSuspiciousContent(req.query, 'query');
  }

  next();
};

/**
 * Sanitize request body for logging
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: any): any {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize response body for logging
 */
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  // Don't log large response bodies
  const bodyString = JSON.stringify(body);
  if (bodyString.length > 1000) {
    return '[LARGE_RESPONSE_BODY]';
  }

  const sensitiveFields = ['token', 'secret', 'key', 'password'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Database query logging
 */
export const dbQueryLogger = {
  logQuery: (query: string, params?: any[], duration?: number): void => {
    logger.debug('Database query', {
      query: query.substring(0, 200), // First 200 chars
      params: params?.slice(0, 10), // First 10 params
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  logSlowQuery: (query: string, params?: any[], duration?: number, threshold: number = 1000): void => {
    if (duration && duration > threshold) {
      logger.warn('Slow database query', {
        query: query.substring(0, 200),
        params: params?.slice(0, 10),
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
      });
    }
  },
};