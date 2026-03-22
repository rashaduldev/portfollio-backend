import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from '../types/index.js';

export const generateAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as RefreshTokenPayload;

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
