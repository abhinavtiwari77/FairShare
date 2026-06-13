import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name is too long'),
  description: z.string().max(500).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const transferAdminSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});
