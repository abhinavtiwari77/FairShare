import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name is too long'),
  description: z.string().max(500).optional(),
  members: z.array(z.object({
    userId: z.string().uuid(),
    joinedAt: z.string().datetime().optional()
  })).optional()
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  joinedAt: z.string().datetime().optional(),
});

export const updateMemberSchema = z.object({
  joinedAt: z.string().datetime().optional(),
  leftAt: z.string().datetime().nullable().optional(),
});

export const transferAdminSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});
