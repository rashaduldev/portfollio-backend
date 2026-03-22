import type { Request, Response, NextFunction } from 'express';
import type {
  PaginationMeta,
  PaginationOptions,
  SendSuccessOptions,
  ApiResponse,
} from '../types/index.js';

/** Send a standardized success JSON response */
export const sendSuccess = <T>(
  res: Response,
  options: SendSuccessOptions<T> = {}
): Response<ApiResponse<T>> => {
  const { data, message = 'Success', statusCode = 200, meta } = options;
  const response: ApiResponse<T> = { success: true, message };
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/** Build pagination metadata */
export const buildPaginationMeta = (params: {
  total: number;
  page: number;
  limit: number;
}): PaginationMeta => {
  const { total, page, limit } = params;
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/** Parse and sanitize pagination query params */
export const parsePagination = (query: Record<string, unknown>): PaginationOptions => {
  const page  = Math.max(1, parseInt(String(query.page  ?? '1'),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '10'), 10)));
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Build a Mongoose sort object from a query string.
 * e.g. "-createdAt,title" → { createdAt: -1, title: 1 }
 */
export const buildSort = (
  sortQuery?: string,
  defaultSort: Record<string, 1 | -1> = { createdAt: -1 }
): Record<string, 1 | -1> => {
  if (!sortQuery) return defaultSort;
  return sortQuery.split(',').reduce<Record<string, 1 | -1>>((acc, field) => {
    if (field.startsWith('-')) {
      acc[field.slice(1)] = -1;
    } else {
      acc[field] = 1;
    }
    return acc;
  }, {});
};

/** Wrap an async route handler so errors propagate to Express error handler */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
