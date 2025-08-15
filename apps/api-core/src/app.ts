import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiRoutes } from './routes/index';
import { errorHandler, notFoundHandler, requestTimeout } from './middleware/error';
import { requestLogger, performanceLogger } from './middleware/logging';
import { validateRequestSize } from './middleware/validation';
import { rateLimit, rateLimitConfigs } from './middleware/rateLimit';
import { setupProcessErrorHandlers } from './middleware/error';
import { logger } from './middleware/logging';
import { setupSwagger } from './config/swagger';

/**
 * Create Express application
 */
export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        scriptSrc: ["'self'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://unpkg.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  }));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Skip all potentially problematic middleware for now
  // app.use(validateRequestSize);
  // app.use(requestTimeout(30000));
  // app.use(rateLimit(rateLimitConfigs.general));
  // app.use(requestLogger);
  // app.use(performanceLogger);

  // Trust proxy (for accurate IP addresses behind load balancers)
  app.set('trust proxy', 1);

  // API routes
  app.use('/api/core', apiRoutes);

  // Setup Swagger documentation
  setupSwagger(app);

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'CRM API Core Server',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  // Setup process error handlers
  setupProcessErrorHandlers();

  return app;
}

/**
 * Start the server
 */
export function startServer(port: number = 3001) {
  const app = createApp();

  const server = app.listen(port, () => {
    logger.info(`CRM API Core server started on port ${port}`, {
      port,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.API_VERSION || '1.0.0',
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown', { error: err.message });
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}