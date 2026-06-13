import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireGroupMember } from '../middleware/groups.middleware.js';
import { requireExpenseAccess, requireExpenseCreatorOrAdmin } from '../middleware/expenses.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expenses.validation.js';
import * as expensesController from '../controllers/expenses.controller.js';

const router = express.Router({ mergeParams: true });

// Group-scoped expense routes (/api/v1/groups/:groupId/expenses)
router.post(
  '/',
  authenticate,
  requireGroupMember,
  validateRequest(createExpenseSchema),
  expensesController.createExpense
);

router.get(
  '/',
  authenticate,
  requireGroupMember,
  expensesController.getGroupExpenses
);

// Global expense routes (/api/v1/expenses/:expenseId)
export const globalExpenseRoutes = express.Router({ mergeParams: true });

globalExpenseRoutes.get(
  '/:expenseId',
  authenticate,
  requireExpenseAccess,
  expensesController.getExpenseDetails
);

globalExpenseRoutes.patch(
  '/:expenseId',
  authenticate,
  requireExpenseAccess,
  requireExpenseCreatorOrAdmin,
  validateRequest(updateExpenseSchema),
  expensesController.updateExpense
);

globalExpenseRoutes.delete(
  '/:expenseId',
  authenticate,
  requireExpenseAccess,
  requireExpenseCreatorOrAdmin,
  expensesController.deleteExpense
);

export default router;
