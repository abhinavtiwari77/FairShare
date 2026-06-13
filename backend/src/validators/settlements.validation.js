import { z } from 'zod';

export const createSettlementSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid(),
    amount: z.number().positive(),
    note: z.string().max(255).optional().nullable()
  })
});
