import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const registerUser = async ({ fullName, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
    },
    select: { id: true, email: true, fullName: true, avatarUrl: true, createdAt: true }
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret_for_dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};
