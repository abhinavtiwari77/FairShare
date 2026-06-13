import { z } from 'zod';

const SplitType = z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']);
const ExpenseCategory = z.enum([
  'FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ENTERTAINMENT', 'UTILITIES', 'SHOPPING', 'OTHER'
]);

const participantSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  value: z.number().positive('Value must be positive').optional()
});

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    amount: z.number().positive('Amount must be positive'),
    paidById: z.string().uuid('Invalid paidById format'),
    splitType: SplitType,
    category: ExpenseCategory.optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
    expenseDate: z.string().datetime().optional(),
    participants: z.array(participantSchema).min(1, 'At least one participant is required')
  })
}).refine(data => {
  if (data.body.splitType !== 'EQUAL') {
    return data.body.participants.every(p => p.value !== undefined && p.value > 0);
  }
  return true;
}, {
  message: "Value is required for all participants unless split type is EQUAL",
  path: ["body", "participants"]
});

export const updateExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    paidById: z.string().uuid().optional(),
    splitType: SplitType.optional(),
    category: ExpenseCategory.optional(),
    notes: z.string().max(500).optional(),
    expenseDate: z.string().datetime().optional(),
    participants: z.array(participantSchema).min(1).optional()
  })
}).refine(data => {
  if (data.body.participants && data.body.splitType) {
    if (data.body.splitType !== 'EQUAL') {
      return data.body.participants.every(p => p.value !== undefined && p.value > 0);
    }
  }
  return true;
}, {
  message: "Value is required for all participants unless split type is EQUAL",
  path: ["body", "participants"]
});
