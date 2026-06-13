import { registerSchema, loginSchema } from '../validators/auth.validation.js';
import * as authService from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.registerUser(validatedData);
    const token = authService.generateToken(user.id);

    res.cookie('token', token, cookieOptions);
    res.status(201).json({ user });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message, code: 'CONFLICT' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await authService.loginUser(validatedData);
    const token = authService.generateToken(user.id);

    res.cookie('token', token, cookieOptions);
    res.json({ user });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message, code: 'UNAUTHORIZED' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};
