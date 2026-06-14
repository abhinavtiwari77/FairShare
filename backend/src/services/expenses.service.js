import prisma from '../lib/prisma.js';
import { calculateExpenseSplits } from './splitCalculator.js';

export const createExpense = async (groupId, createdById, data) => {
  const { title, amount, paidById, splitType, category, notes, expenseDate, participants } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Create Expense
    const expense = await tx.expense.create({
      data: {
        groupId,
        title,
        amount,
        paidById,
        splitType,
        category,
        notes,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        createdById
      }
    });

    // 2. Fetch Members & Filter Participants
    const groupMembers = await tx.groupMember.findMany({ where: { groupId } });
    const expDate = expenseDate ? new Date(expenseDate) : new Date();
    
    // Only keep participants who were active on the expense date
    const activeParticipants = participants.filter(p => {
      const member = groupMembers.find(m => m.userId === p.userId);
      if (!member) return false;
      const joinedAt = new Date(member.joinedAt);
      if (joinedAt > expDate) return false;
      if (member.leftAt) {
        const leftAt = new Date(member.leftAt);
        if (leftAt < expDate) return false;
      }
      return true;
    });

    if (activeParticipants.length === 0) {
      throw new Error('No active members available on the specified expense date to split this expense');
    }

    // 3. Insert Participants
    const participantData = activeParticipants.map((p, index) => ({
      expenseId: expense.id,
      userId: p.userId,
      splitValue: p.value !== undefined ? p.value : null,
      sortOrder: index
    }));
    await tx.expenseParticipant.createMany({ data: participantData });

    // 3. Calculate Splits
    // Strict boundary: Convert Prisma Decimal constraints/logic to standard JS Numbers
    const calculatedSplits = calculateExpenseSplits(
      Number(amount),
      splitType,
      activeParticipants.map(p => ({
        userId: p.userId,
        value: p.value !== undefined ? Number(p.value) : undefined
      }))
    );

    // 5. Insert Splits
    const splitData = calculatedSplits.map(split => ({
      expenseId: expense.id,
      userId: split.userId,
      amountOwed: split.amountOwed
    }));
    await tx.expenseSplit.createMany({ data: splitData });

    return expense;
  });
};

export const getGroupExpenses = async (groupId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const expenses = await prisma.expense.findMany({
    where: { groupId, deletedAt: null },
    orderBy: { createdAt: 'desc' }, // newest first
    skip,
    take: limit,
    include: {
      paidBy: { select: { id: true, fullName: true, avatarUrl: true } },
      createdBy: { select: { id: true, fullName: true, avatarUrl: true } },
      splits: { select: { userId: true, amountOwed: true } }
    }
  });

  const total = await prisma.expense.count({
    where: { groupId, deletedAt: null }
  });

  return {
    expenses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getExpenseDetails = async (expenseId) => {
  return await prisma.expense.findUnique({
    where: { id: expenseId, deletedAt: null },
    include: {
      participants: {
        orderBy: { sortOrder: 'asc' },
        include: { user: { select: { id: true, fullName: true, avatarUrl: true, email: true } } }
      },
      splits: {
        include: { user: { select: { id: true, fullName: true, avatarUrl: true, email: true } } }
      },
      paidBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
    }
  });
};

export const updateExpense = async (expenseId, data) => {
  return await prisma.$transaction(async (tx) => {
    // Determine what needs to be updated
    const currentExpense = await tx.expense.findUnique({
      where: { id: expenseId },
      include: { participants: true }
    });

    if (!currentExpense) throw new Error("Expense not found");

    const amount = data.amount !== undefined ? data.amount : Number(currentExpense.amount);
    const splitType = data.splitType || currentExpense.splitType;
    
    let participants = data.participants;
    if (!participants) {
      participants = currentExpense.participants.map(p => ({
        userId: p.userId,
        value: p.splitValue !== null ? Number(p.splitValue) : undefined
      }));
    }

    // 1. Remove old participants and splits
    await tx.expenseParticipant.deleteMany({ where: { expenseId } });
    await tx.expenseSplit.deleteMany({ where: { expenseId } });

    // 2. Update Expense
    const updatedExpense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        title: data.title,
        amount: data.amount,
        paidById: data.paidById,
        splitType: data.splitType,
        category: data.category,
        notes: data.notes,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined
      }
    });

    // 3. Fetch Members & Filter Participants
    const groupMembers = await tx.groupMember.findMany({ where: { groupId: currentExpense.groupId } });
    const expDate = data.expenseDate ? new Date(data.expenseDate) : currentExpense.expenseDate;
    
    // Only keep participants who were active on the expense date
    const activeParticipants = participants.filter(p => {
      const member = groupMembers.find(m => m.userId === p.userId);
      if (!member) return false;
      const joinedAt = new Date(member.joinedAt);
      if (joinedAt > expDate) return false;
      if (member.leftAt) {
        const leftAt = new Date(member.leftAt);
        if (leftAt < expDate) return false;
      }
      return true;
    });

    if (activeParticipants.length === 0) {
      throw new Error('No active members available on the specified expense date to split this expense');
    }

    // 4. Insert new participants
    const participantData = activeParticipants.map((p, index) => ({
      expenseId,
      userId: p.userId,
      splitValue: p.value !== undefined ? p.value : null,
      sortOrder: index
    }));
    await tx.expenseParticipant.createMany({ data: participantData });

    // 5. Calculate new splits
    const calculatedSplits = calculateExpenseSplits(
      Number(amount),
      splitType,
      activeParticipants.map(p => ({
        userId: p.userId,
        value: p.value !== undefined ? Number(p.value) : undefined
      }))
    );

    // 6. Insert new splits
    const splitData = calculatedSplits.map(split => ({
      expenseId,
      userId: split.userId,
      amountOwed: split.amountOwed
    }));
    await tx.expenseSplit.createMany({ data: splitData });

    return updatedExpense;
  });
};

export const deleteExpense = async (expenseId) => {
  return await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() }
  });
};
