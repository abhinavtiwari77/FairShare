import prisma from '../lib/prisma.js';

export const requireExpenseAccess = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, deletedAt: null }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found', code: 'NOT_FOUND' });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: expense.groupId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: Not a group member', code: 'FORBIDDEN' });
    }

    req.expense = expense;
    req.membership = membership;
    next();
  } catch {
    return res.status(500).json({ error: 'Internal server error checking expense access', code: 'INTERNAL_ERROR' });
  }
};

export const requireExpenseCreatorOrAdmin = async (req, res, next) => {
  try {
    const expense = req.expense; // Populated by requireExpenseAccess
    const membership = req.membership; // Populated by requireExpenseAccess
    const userId = req.user.id;

    if (expense.createdById !== userId && membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Must be expense creator or group admin', code: 'FORBIDDEN' });
    }

    next();
  } catch {
    return res.status(500).json({ error: 'Internal server error checking permissions', code: 'INTERNAL_ERROR' });
  }
};
