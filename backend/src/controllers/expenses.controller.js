import * as expensesService from '../services/expenses.service.js';

export const createExpense = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;
    
    const expense = await expensesService.createExpense(groupId, userId, req.body);
    
    return res.status(201).json({ expense });
  } catch (error) {
    const msg = error.message ? error.message.toLowerCase() : '';
    if (msg.includes('split') || msg.includes('sum') || msg.includes('amount') || msg.includes('percent')) {
      return res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
    }
    console.error('CREATE EXPENSE ERROR:', error);
    return res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters', code: 'VALIDATION_ERROR' });
    }

    const result = await expensesService.getGroupExpenses(groupId, page, limit);
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: 'Internal server error fetching expenses', code: 'INTERNAL_ERROR' });
  }
};

export const getExpenseDetails = async (req, res) => {
  try {
    const expense = await expensesService.getExpenseDetails(req.params.expenseId);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found', code: 'NOT_FOUND' });
    }

    // Return specific shape requested by requirements
    return res.status(200).json({
      expense: {
        id: expense.id,
        groupId: expense.groupId,
        title: expense.title,
        amount: expense.amount,
        splitType: expense.splitType,
        category: expense.category,
        notes: expense.notes,
        expenseDate: expense.expenseDate,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      },
      participants: expense.participants,
      splits: expense.splits,
      creator: expense.createdBy,
      payer: expense.paidBy
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error fetching expense details', code: 'INTERNAL_ERROR' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;
    const updatedExpense = await expensesService.updateExpense(expenseId, req.body);
    
    return res.status(200).json({ expense: updatedExpense });
  } catch (error) {
    const msg = error.message ? error.message.toLowerCase() : '';
    if (msg.includes('split') || msg.includes('sum') || msg.includes('amount') || msg.includes('percent')) {
      return res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
    }
    console.error('UPDATE EXPENSE ERROR:', error);
    return res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await expensesService.deleteExpense(req.params.expenseId);
    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Internal server error deleting expense', code: 'INTERNAL_ERROR' });
  }
};
