import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoginInput, RegisterInput } from '@transparency-ph/shared-types';

vi.mock('../repositories/user.repository.js', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));
vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));
vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn(() => 'signed-access-token'),
  signRefreshToken: vi.fn(() => 'signed-refresh-token'),
  verifyRefreshToken: vi.fn(),
}));

import * as userRepository from '../repositories/user.repository.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { verifyRefreshToken } from '../lib/jwt.js';
import * as authService from './auth.service.js';

const registerInput: RegisterInput = {
  email: 'citizen@example.com',
  password: 'correct-horse-battery',
  fullName: 'Juana Dela Cruz',
};

const loginInput: LoginInput = {
  email: 'citizen@example.com',
  password: 'correct-horse-battery',
};

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('rejects when the email is already registered', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: registerInput.email,
        passwordHash: 'hash',
        fullName: 'Existing User',
        role: 'CITIZEN',
      });

      await expect(authService.register(registerInput)).rejects.toMatchObject({ statusCode: 409 });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('hashes the password and issues both tokens on success', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue('hashed-password');
      vi.mocked(userRepository.create).mockResolvedValue({
        id: 'user-1',
        email: registerInput.email,
        fullName: registerInput.fullName,
        role: 'CITIZEN',
      });

      const result = await authService.register(registerInput);

      expect(hashPassword).toHaveBeenCalledWith(registerInput.password);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: registerInput.email, passwordHash: 'hashed-password' }),
      );
      expect(result).toMatchObject({ accessToken: 'signed-access-token', refreshToken: 'signed-refresh-token' });
    });
  });

  describe('login', () => {
    it('rejects with 401 when no account matches the email (not a distinguishable 404)', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('rejects with the same 401 message when the password is wrong', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: loginInput.email,
        passwordHash: 'hash',
        fullName: 'Juana Dela Cruz',
        role: 'CITIZEN',
      });
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('issues tokens and omits the password hash on success', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: loginInput.email,
        passwordHash: 'hash',
        fullName: 'Juana Dela Cruz',
        role: 'CITIZEN',
      });
      vi.mocked(comparePassword).mockResolvedValue(true);

      const result = await authService.login(loginInput);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBe('signed-refresh-token');
    });
  });

  describe('refresh', () => {
    it('rejects when the refresh token fails verification', async () => {
      vi.mocked(verifyRefreshToken).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh('bad-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects when the token is valid but the user no longer exists', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue({ sub: 'deleted-user' });
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(authService.refresh('valid-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('issues a new access token, not a rotated refresh token', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue({ sub: 'user-1' });
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-1',
        email: 'citizen@example.com',
        fullName: 'Juana Dela Cruz',
        role: 'CITIZEN',
      });

      const result = await authService.refresh('valid-token');

      expect(result).toEqual({ accessToken: 'signed-access-token' });
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('getMe', () => {
    it('throws a 404 when the user no longer exists', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(authService.getMe('missing-user')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
