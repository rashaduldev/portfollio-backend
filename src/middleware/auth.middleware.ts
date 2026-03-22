import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import {
  AuthenticationError,
  AuthorizationError,
} from '../utils/errors.js';
import { catchAsync } from '../utils/helpers.js';
import User from '../models/user.model.js';
import type { UserRole } from '../types/index.js';

/**
 * Protect route — verifies JWT access token and attaches user to req.user
 */
export const protect = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken as string;
  }

  if (!token) throw new AuthenticationError('No token provided. Please log in.');

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) throw new AuthenticationError('The user belonging to this token no longer exists.');

  if (user.changedPasswordAfter(decoded.iat ?? 0)) {
    throw new AuthenticationError('Password was recently changed. Please log in again.');
  }

  if (!user.isActive) throw new AuthenticationError('Your account has been deactivated.');

  req.user = user;
  next();
});

/**
 * Role-based access control — call after protect()
 */
export const restrictTo = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }
    next();
  };

/**
 * Optional auth — attaches user if valid token present, never blocks request
 */
export const optionalAuth = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next();

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user?.isActive) req.user = user;
    } catch {
      // silently ignore — optional auth never blocks
    }

    next();
  }
);
