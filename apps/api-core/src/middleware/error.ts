import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '@/utils/errors';
import { config, isDevelopment } from '@/config';

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Log error details
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    },
  });

  // Send error response
  ErrorHandler.sendErrorResponse(res, error);
};

/**
 * 404 Not Found handler
 * Should be placed after all routes but before error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.name = 'NotFoundError';
  (error as any).statusCode = 404;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip timeout for Swagger documentation endpoints and static assets
    if (req.url.startsWith('/api/docs') || req.url.includes('swagger') || req.url.endsWith('.json')) {
      return next();
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new Error('Request timeout');
        error.name = 'TimeoutError';
        (error as any).statusCode = 408;
        next(error);
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Graceful shutdown handler
 */
export class GracefulShutdown {
  private static isShuttingDown = false;
  private static connections = new Set<Response>();

  /**
   * Track active connections
   */
  static trackConnection(req: Request, res: Response, next: NextFunction): void {
    if (GracefulShutdown.isShuttingDown) {
      res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Server is shutting down',
        statusCode: 503,
      });
      return;
    }

    GracefulShutdown.connections.add(res);

    res.on('finish', () => {
      GracefulShutdown.connections.delete(res);
    });

    res.on('close', () => {
      GracefulShutdown.connections.delete(res);
    });

    next();
  }

  /**
   * Initiate graceful shutdown
   */
  static async shutdown(server: any): Promise<void> {
    console.log('🔄 Initiating graceful shutdown...');
    GracefulShutdown.isShuttingDown = true;

    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });

    // Wait for existing connections to finish
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();

    while (GracefulShutdown.connections.size > 0 && Date.now() - startTime < maxWaitTime) {
      console.log(`⏳ Waiting for ${GracefulShutdown.connections.size} connections to finish...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (GracefulShutdown.connections.size > 0) {
      console.warn(`⚠️  Forcefully closing ${GracefulShutdown.connections.size} remaining connections`);
    }

    console.log('✅ Graceful shutdown completed');
  }
}

/**
 * Process error handlers
 */
export const setupProcessErrorHandlers = (): void => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    
    if (isDevelopment) {
      console.error(error.stack);
    }

    // In production, exit the process
    if (!isDevelopment) {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (isDevelopment) {
      console.error(reason?.stack || reason);
    }

    // In production, exit the process
    if (!isDevelopment) {
      process.exit(1);
    }
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('📡 SIGTERM received');
    // Graceful shutdown will be handled by the main server
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('📡 SIGINT received');
    // Graceful shutdown will be handled by the main server
  });
};