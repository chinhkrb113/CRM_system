import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Option 1: Verify JWT locally (if we have the secret)
    if (process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        req.user = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
        return next();
      } catch (jwtError) {
        // If local verification fails, try core API
      }
    }

    // Option 2: Verify with core API
    if (process.env.CORE_API_URL) {
      try {
        const response = await axios.get(`${process.env.CORE_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000
        });
        
        req.user = {
          id: response.data.id,
          email: response.data.email,
          role: response.data.role
        };
        return next();
      } catch (apiError) {
        console.error('Core API auth verification failed:', apiError);
      }
    }

    return res.status(401).json({ error: 'Invalid token' });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional middleware for specific roles
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (req.user.role && roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};