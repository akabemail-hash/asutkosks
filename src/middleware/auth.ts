import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Safely access cookies and headers
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const headerToken = authHeader && (authHeader as string).startsWith('Bearer ') 
    ? (authHeader as string).split(' ')[1] 
    : null;

  const token = cookieToken || headerToken;

  if (!token) {
    // Don't log error for /me endpoint as it's used for initial auth check
    if (!req.path.endsWith('/me')) {
      console.log('Auth failed: No token provided for path:', req.path);
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('Auth failed: Invalid token', err.message);
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
  };
};
