import dotenv from 'dotenv';
import { startServer } from './app';
import { logger } from '@/middleware/logging';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', {
    missingVars: missingEnvVars,
  });
  process.exit(1);
}

// Get port from environment or default to 3001
const port = parseInt(process.env.PORT || '3001', 10);

if (isNaN(port) || port <= 0 || port > 65535) {
  logger.error('Invalid port number', { port: process.env.PORT });
  process.exit(1);
}

// Start the server
try {
  startServer(port);
} catch (error) {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
}