import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

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

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      res.status(401).json({ message: 'Invalid token' });
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
    res.status(403).json({ message: 'Forbidden' });
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
    res.status(403).json({ message: 'Forbidden' });
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
  if (!req.user?.orgAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
  return;
};
