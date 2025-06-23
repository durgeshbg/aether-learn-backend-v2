import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validationErrors = {
  INVALID_DATA: 'Invalid data provided',
  INVALID_QUERY_PARAMS: 'Invalid query parameters provided',
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
};

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        res.status(400).json({
          error: validationErrors.INVALID_DATA,
          messages: errorMessages,
        });
      } else {
        res.status(500).json({ error: validationErrors.INTERNAL_SERVER_ERROR });
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        res.status(400).json({
          error: validationErrors.INVALID_QUERY_PARAMS,
          messages: errorMessages,
        });
      } else {
        res.status(500).json({ error: validationErrors.INTERNAL_SERVER_ERROR });
      }
    }
  };
};
