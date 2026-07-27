import type { LoginInput, RefreshInput, RegisterInput } from '@transparency-ph/shared-types';
import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  res.status(200).json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  const result = await authService.refresh(refreshToken);
  res.status(200).json(result);
});

// Protected by the `authenticate` middleware in auth.routes.ts, so req.user
// is guaranteed to be set by the time this runs - the check below is a
// type-narrowing formality, not a real "might this fail" branch.
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ data: user });
});
