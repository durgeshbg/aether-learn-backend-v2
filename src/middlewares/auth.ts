import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma';

type User = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  orgAdmin?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const AuthErrors = {
  UNAUTHORIZED: 'Unauthorized',
  INVALID_TOKEN: 'Invalid token',
  FORBIDDEN: 'Forbidden',
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: AuthErrors.UNAUTHORIZED });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: AuthErrors.INVALID_TOKEN });
      return;
    }
    req.user = decoded as User;
    next();
  });
  return;
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: AuthErrors.FORBIDDEN });
    return;
  }
  next();
  return;
};

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'USER') {
    res.status(403).json({ error: AuthErrors.FORBIDDEN });
    return;
  }
  next();
  return;
};

export const orgAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === Role.ADMIN || req.user?.orgAdmin) {
    next();
    return;
  }
  res.status(403).json({ error: AuthErrors.FORBIDDEN });
  return;
};
