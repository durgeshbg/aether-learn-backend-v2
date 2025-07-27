import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      parsedQuery?: any;
    }
  }
}

export const ValidationErrors = {
  INVALID_DATA: {
    STATUS: 400,
    MESSAGE: 'Invalid data provided',
  },
  INVALID_PARAMS: {
    STATUS: 400,
    MESSAGE: 'Invalid query parameters provided',
  },
  INVALID_QUERY: {
    STATUS: 400,
    MESSAGE: 'Invalid query parameters provided',
  },
  INTERNAL_SERVER_ERROR: {
    STATUS: 500,
    MESSAGE: 'Internal server error occurred',
  },
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
        res.status(ValidationErrors.INVALID_DATA.STATUS).json({
          error: ValidationErrors.INVALID_DATA.MESSAGE,
          messages: errorMessages,
        });
      } else {
        res
          .status(ValidationErrors.INTERNAL_SERVER_ERROR.STATUS)
          .json({ error: ValidationErrors.INTERNAL_SERVER_ERROR.MESSAGE });
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
        res.status(ValidationErrors.INVALID_PARAMS.STATUS).json({
          error: ValidationErrors.INVALID_PARAMS.MESSAGE,
          messages: errorMessages,
        });
      } else {
        res
          .status(ValidationErrors.INTERNAL_SERVER_ERROR.STATUS)
          .json({ error: ValidationErrors.INTERNAL_SERVER_ERROR.MESSAGE });
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.parsedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        res.status(ValidationErrors.INVALID_QUERY.STATUS).json({
          error: ValidationErrors.INVALID_QUERY.MESSAGE,
          messages: errorMessages,
        });
      } else {
        res
          .status(ValidationErrors.INTERNAL_SERVER_ERROR.STATUS)
          .json({ error: ValidationErrors.INTERNAL_SERVER_ERROR.MESSAGE });
      }
    }
  };
};
