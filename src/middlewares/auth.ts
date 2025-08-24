import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma';

type User = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  orgAdmin?: string | null;
};

declare module 'express' {
  interface Request {
    user?: User;
  }
}

export const AuthErrors = {
  UNAUTHORIZED: {
    STATUS: 401,
    MESSAGE: 'Unauthorized access',
  },
  INVALID_TOKEN: {
    STATUS: 401,
    MESSAGE: 'Invalid or expired token',
  },
  FORBIDDEN: {
    STATUS: 403,
    MESSAGE: 'Forbidden access',
  },
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(AuthErrors.UNAUTHORIZED.STATUS).json({
      error: AuthErrors.UNAUTHORIZED.MESSAGE,
    });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      res.status(AuthErrors.INVALID_TOKEN.STATUS).json({
        error: AuthErrors.INVALID_TOKEN.MESSAGE,
      });
      return;
    }
    req.user = decoded as User;
    next();
  });
  return;
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(AuthErrors.FORBIDDEN.STATUS).json({
      error: AuthErrors.FORBIDDEN.MESSAGE,
    });
    return;
  }
  next();
  return;
};

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'USER') {
    res.status(AuthErrors.FORBIDDEN.STATUS).json({
      error: AuthErrors.FORBIDDEN.MESSAGE,
    });
    return;
  }
  next();
  return;
};

export const orgAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === Role.ADMIN) {
    next();
    return;
  }

  if (req.user?.orgAdmin && req.user.orgAdmin !== null) {
    next();
    return;
  }

  res.status(AuthErrors.FORBIDDEN.STATUS).json({
    error: AuthErrors.FORBIDDEN.MESSAGE,
  });
  return;
};
