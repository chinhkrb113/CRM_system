import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '@/utils/errors';
import { AuthRequest } from '@/types';

/**
 * Rate limit store interface
 */
interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit store
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    return entry.count;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + ttl * 1000,
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();
    
    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + ttl * 1000 };
      this.store.set(key, newEntry);
      return 1;
    }
    
    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
  onLimitReached?: (req: Request, res: Response) => void; // Callback when limit is reached
  store?: RateLimitStore; // Custom store
}

/**
 * Default rate limit store
 */
const defaultStore = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  if (defaultStore instanceof MemoryStore) {
    defaultStore.cleanup();
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (config: RateLimitConfig) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skip = () => false,
    onLimitReached,
    store = defaultStore,
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip rate limiting if specified
      if (skip(req)) {
        return next();
      }

      const key = keyGenerator(req);
      const windowSeconds = Math.floor(windowMs / 1000);
      
      // Get current count and increment
      const currentCount = await store.increment(key, windowSeconds);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - currentCount).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
      });

      // Check if limit exceeded
      if (currentCount > max) {
        // Call callback if provided
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        throw new TooManyRequestsError(message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later',
  },

  // Authentication rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 login attempts per 15 minutes (increased for development)
    message: 'Too many login attempts, please try again later',
    keyGenerator: (req: Request) => {
      const email = req.body?.email || 'unknown';
      return `auth:${req.ip}:${email}`;
    },
  },

  // Strict rate limit for sensitive operations
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Rate limit exceeded for sensitive operation',
  },

  // AI scoring rate limit
  aiScoring: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 AI scoring requests per minute
    message: 'Too many AI scoring requests, please try again later',
    keyGenerator: (req: AuthRequest) => {
      const userId = req.user?.id || 'anonymous';
      return `ai-score:${userId}`;
    },
  },

  // Payment link generation rate limit
  paymentLink: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 payment links per 5 minutes
    message: 'Too many payment link requests, please try again later',
    keyGenerator: (req: AuthRequest) => {
      const userId = req.user?.id || 'anonymous';
      return `payment-link:${userId}`;
    },
  },
};

/**
 * User-based rate limiting
 */
export const userRateLimit = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return rateLimit({
    ...config,
    keyGenerator: (req: AuthRequest) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `user:${userId}`;
    },
  });
};

/**
 * IP-based rate limiting
 */
export const ipRateLimit = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => `ip:${req.ip || 'unknown'}`,
  });
};

/**
 * Endpoint-specific rate limiting
 */
export const endpointRateLimit = (endpoint: string, config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => {
      const identifier = (req as AuthRequest).user?.id || req.ip || 'unknown';
      return `endpoint:${endpoint}:${identifier}`;
    },
  });
};

/**
 * Role-based rate limiting
 */
export const roleBasedRateLimit = (roleLimits: Record<string, RateLimitConfig>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userRole = req.user?.role || 'GUEST';
    const config = roleLimits[userRole] || roleLimits['DEFAULT'];
    
    if (!config) {
      return next();
    }

    const rateLimitMiddleware = rateLimit({
      ...config,
      keyGenerator: (req: Request) => {
        const userId = (req as AuthRequest).user?.id || req.ip || 'unknown';
        return `role:${userRole}:${userId}`;
      },
    });

    return rateLimitMiddleware(req, res, next);
  };
};

/**
 * Burst protection middleware
 */
export const burstProtection = (config: {
  burstLimit: number; // Maximum requests in burst window
  burstWindowMs: number; // Burst window in milliseconds
  sustainedLimit: number; // Maximum requests in sustained window
  sustainedWindowMs: number; // Sustained window in milliseconds
}) => {
  const burstLimiter = rateLimit({
    windowMs: config.burstWindowMs,
    max: config.burstLimit,
    message: 'Burst limit exceeded',
  });

  const sustainedLimiter = rateLimit({
    windowMs: config.sustainedWindowMs,
    max: config.sustainedLimit,
    message: 'Sustained rate limit exceeded',
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Apply burst protection first
    burstLimiter(req, res, (burstError) => {
      if (burstError) {
        return next(burstError);
      }

      // Then apply sustained rate limiting
      sustainedLimiter(req, res, next);
    });
  };
};

/**
 * Adaptive rate limiting based on system load
 */
export const adaptiveRateLimit = (baseConfig: RateLimitConfig) => {
  return rateLimit({
    ...baseConfig,
    max: Math.floor(baseConfig.max * getSystemLoadFactor()),
  });
};

/**
 * Get system load factor (simplified)
 */
function getSystemLoadFactor(): number {
  // In a real implementation, this would check system metrics
  // For now, return a static factor
  return 1.0;
}

/**
 * Rate limit bypass for trusted IPs
 */
export const trustedIpBypass = (trustedIps: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip;
    
    if (clientIp && trustedIps.includes(clientIp)) {
      // Add header to indicate bypass
      res.set('X-RateLimit-Bypassed', 'true');
    }
    
    next();
  };
};

/**
 * Rate limit factory for easy usage in routes
 */
export const createRateLimit = {
  general: () => rateLimit(rateLimitConfigs.general),
  auth: () => rateLimit(rateLimitConfigs.auth),
  strict: () => rateLimit(rateLimitConfigs.strict),
  aiScoring: () => rateLimit(rateLimitConfigs.aiScoring),
  paymentLinks: () => rateLimit(rateLimitConfigs.paymentLink),
};