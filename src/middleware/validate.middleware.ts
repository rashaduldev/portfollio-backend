import type { Request, Response, NextFunction } from 'express';
import type { ObjectSchema } from 'joi';
import { ValidationError } from '../utils/errors.js';

type RequestSource = 'body' | 'params' | 'query';

/**
 * Validate a single request source against a Joi schema
 */
export const validate = (
  schema: ObjectSchema,
  source: RequestSource = 'body'
) => (req: Request, _res: Response, next: NextFunction): void => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
  });

  if (error) {
    const message = error.details
      .map((d) => d.message.replace(/"/g, "'"))
      .join('; ');
    return next(new ValidationError(message));
  }

  // Assign the coerced/stripped value back
  (req as Request & Record<string, unknown>)[source] = value;
  next();
};

/**
 * Validate multiple sources at once: { body?, params?, query? }
 */
export const validateAll = (
  schemas: Partial<Record<RequestSource, ObjectSchema>>
) => (req: Request, _res: Response, next: NextFunction): void => {
  const errors: string[] = [];

  for (const [source, schema] of Object.entries(schemas) as [RequestSource, ObjectSchema][]) {
    if (!schema) continue;
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      errors.push(...error.details.map((d) => d.message.replace(/"/g, "'")));
    } else {
      (req as Request & Record<string, unknown>)[source] = value;
    }
  }

  if (errors.length) return next(new ValidationError(errors.join('; ')));
  next();
};
