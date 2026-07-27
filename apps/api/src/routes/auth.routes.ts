import { loginSchema, refreshSchema, registerSchema } from '@transparency-ph/shared-types';
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);
authRouter.post('/refresh', validate(refreshSchema, 'body'), authController.refresh);
authRouter.get('/me', authenticate, authController.me);
