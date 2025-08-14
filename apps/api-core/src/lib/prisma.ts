import { PrismaClient } from '@prisma/client';
import { config, isDevelopment } from '@/config';

// Prisma Client singleton
class PrismaService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
        errorFormat: 'pretty',
      });

      // Handle graceful shutdown
      process.on('beforeExit', async () => {
        await PrismaService.instance.$disconnect();
      });

      process.on('SIGINT', async () => {
        await PrismaService.instance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await PrismaService.instance.$disconnect();
        process.exit(0);
      });
    }

    return PrismaService.instance;
  }

  public static async connect(): Promise<void> {
    try {
      await PrismaService.getInstance().$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      await PrismaService.getInstance().$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      await PrismaService.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Export the singleton instance
export const prisma = PrismaService.getInstance();
export { PrismaService };

// Export Prisma types for convenience
export type {
  User,
  Lead,
  Interaction,
  Appointment,
  Payment,
  AuditLog,
} from '@prisma/client';