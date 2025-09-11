import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

// Validation middleware factory
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query) as any;
      }

      // Validate route parameters
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError('Request validation failed');
        validationError.message = error.issues
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export default validate;
