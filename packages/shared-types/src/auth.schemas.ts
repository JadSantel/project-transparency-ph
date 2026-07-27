import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  // 8 chars is a floor, not a strength policy - deliberately not requiring
  // mixed case/symbols here, since composition rules push people toward
  // predictable substitutions more than they stop guessing. Long+unique is
  // what actually matters, and that's a UX nudge, not something to enforce
  // server-side.
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(200),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
