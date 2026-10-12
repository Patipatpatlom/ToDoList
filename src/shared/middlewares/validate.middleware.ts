import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/shared/errors/index.js';

export interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: RequestValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
        res.locals.body = req.body;
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        res.locals.query = parsed;
        try {
          Object.assign(req.query, parsed);
        } catch {
          // fallback if query object properties are strictly non-extensible
        }
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        res.locals.params = parsed;
        try {
          Object.assign(req.params, parsed);
        } catch {
          // fallback if params object properties are strictly non-extensible
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          rule: issue.code,
        }));
        next(new ValidationError('Request validation failed', details));
        return;
      }
      next(error);
    }
  };
};
