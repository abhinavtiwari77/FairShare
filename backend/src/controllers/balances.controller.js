import prisma from '../lib/prisma.js';
import { calculateGroupBalances, calculatePairwiseDebts, calculateUserSummary } from '../services/balanceService.js';

const mapExpenseNumbers = (expenses) => {
  return expenses.map(exp => ({
    ...exp,
    amount: Number(exp.amount),
    payerId: exp.paidById,
    splits: exp.splits.map(s => ({
      ...s,
      amountOwed: Number(s.amountOwed)
    }))
  }));
};

const mapSettlementNumbers = (settlements) => {
  return settlements.map(s => ({
    ...s,
    amount: Number(s.amount)
  }));
};

export const getGroupBalances = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;

    const [expensesRaw, settlementsRaw, groupMembers] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId, deletedAt: null },
        include: { splits: true }
      }),
      prisma.settlement.findMany({
        where: { groupId, deletedAt: null }
      }),
      prisma.groupMember.findMany({
        where: { groupId },
        include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } }
      })
    ]);

    const expenses = mapExpenseNumbers(expensesRaw);
    const settlements = mapSettlementNumbers(settlementsRaw);

    const pairwiseDebts = calculatePairwiseDebts(expenses, settlements);
    const memberBalancesObj = calculateGroupBalances(expenses, settlements);

    const usersMap = {};
    groupMembers.forEach(m => {
      usersMap[m.userId] = m.user;
    });

    // Hydrate debts with user details
    const hydratedDebts = pairwiseDebts.map(debt => ({
      ...debt,
      debtor: usersMap[debt.debtorId],
      creditor: usersMap[debt.creditorId]
    }));

    // Hydrate member balances
    const memberBalances = Object.keys(memberBalancesObj).map(userId => ({
      userId,
      user: usersMap[userId],
      balance: memberBalancesObj[userId]
    }));

    return res.status(200).json({
      pairwiseDebts: hydratedDebts,
      memberBalances
    });
  } catch (error) {
    console.error('GET GROUP BALANCES ERROR:', error);
    return res.status(500).json({ error: 'Failed to calculate group balances', code: 'INTERNAL_ERROR' });
  }
};

export const getUserBalances = async (req, res) => {
  try {
    const userId = req.user.id;

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId }
    });
    
    const groupIds = groupMemberships.map(m => m.groupId);

    const [expensesRaw, settlementsRaw] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: { in: groupIds }, deletedAt: null },
        include: { splits: true }
      }),
      prisma.settlement.findMany({
        where: { groupId: { in: groupIds }, deletedAt: null }
      })
    ]);

    const expenses = mapExpenseNumbers(expensesRaw);
    const settlements = mapSettlementNumbers(settlementsRaw);

    const pairwiseDebts = calculatePairwiseDebts(expenses, settlements);
    
    const userSummary = calculateUserSummary(userId, pairwiseDebts);

    return res.status(200).json({
      totalOwe: userSummary.totalOwe,
      totalOwed: userSummary.totalOwed,
      netBalance: userSummary.net
    });
  } catch (error) {
    console.error('GET USER BALANCES ERROR:', error);
    return res.status(500).json({ error: 'Failed to calculate user summary', code: 'INTERNAL_ERROR' });
  }
};
