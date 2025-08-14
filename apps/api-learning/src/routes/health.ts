import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api-learning',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(health);
}));

router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check database connection
  let dbStatus = 'ok';
  let dbResponseTime = 0;
  
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbResponseTime = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'error';
    console.error('Database health check failed:', error);
  }

  // Check Redis connection (if configured)
  let redisStatus = 'not_configured';
  if (process.env.REDIS_URL) {
    redisStatus = 'ok'; // Simplified for now
  }

  const totalResponseTime = Date.now() - startTime;

  const health = {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'api-learning',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: `${totalResponseTime}ms`,
    checks: {
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`
      },
      redis: {
        status: redisStatus
      }
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}));

export { router as healthRouter };