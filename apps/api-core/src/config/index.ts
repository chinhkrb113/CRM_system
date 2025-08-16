import dotenv from 'dotenv';
import { EnvConfig } from '@/types';

// Load environment variables
dotenv.config();

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

export const config: EnvConfig = {
  PORT: getEnvNumber('PORT', 3000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET', getEnvVar('JWT_SECRET')),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
  AI_SERVICE_URL: getEnvVar('AI_SERVICE_URL', 'http://localhost:3001'),
  AI_SERVICE_API_KEY: getEnvVar('AI_SERVICE_API_KEY', 'dev-key'),
  PAYMENT_SERVICE_URL: getEnvVar('PAYMENT_SERVICE_URL', 'https://payment.crm.com'),
  PAYMENT_WEBHOOK_SECRET: getEnvVar('PAYMENT_WEBHOOK_SECRET', 'webhook-secret'),
  ALLOWED_ORIGINS: getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
  MAX_FILE_SIZE: getEnvVar('MAX_FILE_SIZE', '10MB'),
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Validate critical configuration
if (!config.JWT_SECRET || config.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
  console.warn('⚠️  Using default JWT_SECRET. Change this in production!');
}

if (!config.DATABASE_URL.includes('mysql://') && !config.DATABASE_URL.includes('postgresql://') && !config.DATABASE_URL.includes('file:')) {
  throw new Error('DATABASE_URL must be a valid MySQL, PostgreSQL, or SQLite connection string');
}

console.log(`🚀 Configuration loaded for ${config.NODE_ENV} environment`);