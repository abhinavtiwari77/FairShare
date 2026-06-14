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

export const getLedgerTrace = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    const userId = req.query.userId || req.user.id;

    // Fetch all expenses in the group
    const expenses = await prisma.expense.findMany({
      where: { groupId, deletedAt: null },
      include: { splits: true }
    });

    // Fetch all settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId, deletedAt: null }
    });

    const ledger = [];
    let runningBalance = 0; // positive means they are owed, negative means they owe

    // Process expenses where user is involved
    expenses.forEach(exp => {
      const amount = Number(exp.amount);
      const isPayer = exp.paidById === userId;
      const userSplit = exp.splits.find(s => s.userId === userId);
      const userOwes = userSplit ? Number(userSplit.amountOwed) : 0;

      if (isPayer || userOwes > 0) {
        let impact = 0;
        if (isPayer) {
          // If I paid, I am owed the amount minus my own split
          impact += (amount - userOwes);
        } else if (userOwes > 0) {
          // If I didn't pay but I have a split, I owe that split
          impact -= userOwes;
        }

        if (impact !== 0) {
          runningBalance += impact;
          ledger.push({
            id: exp.id,
            type: 'EXPENSE',
            date: exp.expenseDate,
            title: exp.title,
            impact,
            runningBalance,
            details: isPayer ? `You paid ₹${amount.toFixed(2)}, your share was ₹${userOwes.toFixed(2)}` : `You owe ₹${userOwes.toFixed(2)}`
          });
        }
      }
    });

    // Process settlements
    settlements.forEach(settlement => {
      const amount = Number(settlement.amount);
      if (settlement.payerId === userId) {
        // User paid someone -> positive impact on balance (they are owed less / owe less)
        runningBalance += amount;
        ledger.push({
          id: settlement.id,
          type: 'SETTLEMENT',
          date: settlement.createdAt,
          title: 'Settlement Paid',
          impact: amount,
          runningBalance,
          details: `You paid ₹${amount.toFixed(2)}`
        });
      } else if (settlement.receiverId === userId) {
        // User received money -> negative impact on balance
        runningBalance -= amount;
        ledger.push({
          id: settlement.id,
          type: 'SETTLEMENT',
          date: settlement.createdAt,
          title: 'Settlement Received',
          impact: -amount,
          runningBalance,
          details: `You received ₹${amount.toFixed(2)}`
        });
      }
    });

    // Sort ledger by date
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Recalculate running balance correctly after sorting
    let sequentialBalance = 0;
    ledger.forEach(item => {
      sequentialBalance += item.impact;
      item.runningBalance = sequentialBalance;
    });

    return res.status(200).json({ ledger, finalBalance: sequentialBalance });
  } catch (error) {
    console.error('GET LEDGER TRACE ERROR:', error);
    return res.status(500).json({ error: 'Failed to calculate ledger trace', code: 'INTERNAL_ERROR' });
  }
};
