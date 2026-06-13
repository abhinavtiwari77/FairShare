import prisma from '../lib/prisma.js';
import { calculatePairwiseDebts, applySettlement } from '../services/balanceService.js';

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

export const createSettlement = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    const payerId = req.user.id;
    const { receiverId, amount, note } = req.body;

    if (payerId === receiverId) {
      return res.status(400).json({ error: 'Cannot settle with yourself', code: 'VALIDATION_ERROR' });
    }

    // Load group members to ensure receiver is in group
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: receiverId } }
    });
    if (!membership) {
      return res.status(400).json({ error: 'Receiver is not a member of the group', code: 'VALIDATION_ERROR' });
    }

    // Load expenses and settlements to compute current debts
    const [expensesRaw, settlementsRaw] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId, deletedAt: null },
        include: { splits: true }
      }),
      prisma.settlement.findMany({
        where: { groupId, deletedAt: null }
      })
    ]);

    const expenses = mapExpenseNumbers(expensesRaw);
    const settlements = mapSettlementNumbers(settlementsRaw);

    const pairwiseDebts = calculatePairwiseDebts(expenses, settlements);

    // Ensure we don't over-settle
    try {
      applySettlement(payerId, receiverId, amount, pairwiseDebts);
    } catch (err) {
      return res.status(400).json({ error: err.message, code: 'VALIDATION_ERROR' });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        receiverId,
        amount,
        note,
        createdById: req.user.id
      },
      include: {
        payer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } }
      }
    });

    return res.status(201).json({ settlement });
  } catch (error) {
    console.error('CREATE SETTLEMENT ERROR:', error);
    return res.status(500).json({ error: 'Internal server error creating settlement', code: 'INTERNAL_ERROR' });
  }
};

export const getSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { groupId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          receiver: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          createdBy: { select: { id: true, fullName: true } }
        }
      }),
      prisma.settlement.count({
        where: { groupId, deletedAt: null }
      })
    ]);

    return res.status(200).json({
      settlements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET SETTLEMENTS ERROR:', error);
    return res.status(500).json({ error: 'Internal server error fetching settlements', code: 'INTERNAL_ERROR' });
  }
};

export const deleteSettlement = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    const { settlementId } = req.params;
    const userId = req.user.id;

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId }
    });

    if (!settlement || settlement.groupId !== groupId || settlement.deletedAt !== null) {
      return res.status(404).json({ error: 'Settlement not found', code: 'NOT_FOUND' });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    const isCreator = settlement.createdById === userId;
    const isPayer = settlement.payerId === userId;
    const isReceiver = settlement.receiverId === userId;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isCreator && !isPayer && !isReceiver && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this settlement.', code: 'FORBIDDEN' });
    }

    await prisma.settlement.update({
      where: { id: settlementId },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ success: true, message: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('DELETE SETTLEMENT ERROR:', error);
    return res.status(500).json({ error: 'Internal server error deleting settlement', code: 'INTERNAL_ERROR' });
  }
};
