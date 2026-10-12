import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, NotFoundError } from '@/shared/errors/index.js';
import { logger } from '@/shared/utils/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational Server Error', {
        code: err.code,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
      });
    } else {
      logger.warn('Client Error Handled', {
        code: err.code,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        details: err.details,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 2. Direct Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    logger.warn('Zod Validation Failure', {
      code: 'VALIDATION_ERROR',
      path: req.originalUrl,
      method: req.method,
      issues: formattedErrors,
    });

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
    });
    return;
  }

  // 3. Unhandled unexpected errors
  logger.error('Unhandled Exception Caught', {
    message: err.message,
    name: err.name,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isDevelopment && err.stack ? { stack: err.stack } : {}),
    },
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
};
