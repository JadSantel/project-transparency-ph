import type { LoginInput, RegisterInput } from '@transparency-ph/shared-types';
import { AppError } from '../middlewares/errorHandler.js';
import * as userRepository from '../repositories/user.repository.js';
import type { PublicUser } from '../repositories/user.repository.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';

function issueTokens(user: PublicUser) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

export async function register(input: RegisterInput) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.create({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
  });

  return { user, ...issueTokens(user) };
}

export async function login(input: LoginInput) {
  const credentials = await userRepository.findByEmail(input.email);

  // Same "Invalid email or password" message whether the email isn't
  // registered or the password is wrong - a distinct "no account with
  // that email" message would let a caller enumerate registered emails
  // one guess at a time.
  if (!credentials || !credentials.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(input.password, credentials.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const user: PublicUser = {
    id: credentials.id,
    email: credentials.email,
    fullName: credentials.fullName,
    role: credentials.role,
  };

  return { user, ...issueTokens(user) };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Only a new access token is returned here - the refresh token itself
  // isn't rotated. There's no server-side token store in the schema (no
  // RefreshToken/Session model), so rotation would have nothing to
  // invalidate the old token against and would be cosmetic rather than a
  // real security improvement. Documented as a deliberate scope
  // simplification in the README, not an oversight.
  return { accessToken: signAccessToken({ sub: user.id, role: user.role }) };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}
