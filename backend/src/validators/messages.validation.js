import { z } from 'zod';

export const createMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long')
  })
});
