import { describe, expect, it } from 'vitest';
import { 
  calculatePairwiseDebts, 
  calculateGroupBalances, 
  calculateUserSummary,
  applySettlement
} from '../src/services/balanceService.js';

describe('balanceService', () => {
  it('14. Pairwise debt calculation', () => {
    const expenses = [
      {
        payerId: 'A',
        amount: 100,
        splits: [
          { userId: 'A', amountOwed: 33.33 },
          { userId: 'B', amountOwed: 33.33 },
          { userId: 'C', amountOwed: 33.34 }
        ]
      }
    ];

    const debts = calculatePairwiseDebts(expenses, []);
    expect(debts).toEqual([
      { debtorId: 'B', creditorId: 'A', amount: 33.33 },
      { debtorId: 'C', creditorId: 'A', amount: 33.34 }
    ]);
  });

  it('12. Multiple expenses', () => {
    const expenses = [
      {
        payerId: 'A',
        amount: 100,
        splits: [{ userId: 'B', amountOwed: 100 }]
      },
      {
        payerId: 'B',
        amount: 30,
        splits: [{ userId: 'A', amountOwed: 30 }]
      }
    ];

    const debts = calculatePairwiseDebts(expenses, []);
    expect(debts).toEqual([
      { debtorId: 'B', creditorId: 'A', amount: 70 }
    ]);
  });

  it('10. Settlement partial payment', () => {
    const expenses = [
      { payerId: 'A', amount: 100, splits: [{ userId: 'B', amountOwed: 100 }] }
    ];
    const settlements = [
      { payerId: 'B', receiverId: 'A', amount: 40 }
    ];

    const debts = calculatePairwiseDebts(expenses, settlements);
    expect(debts).toEqual([
      { debtorId: 'B', creditorId: 'A', amount: 60 }
    ]);
  });

  it('13. Multiple settlements', () => {
    const expenses = [
      { payerId: 'A', amount: 100, splits: [{ userId: 'B', amountOwed: 100 }] }
    ];
    const settlements = [
      { payerId: 'B', receiverId: 'A', amount: 40 },
      { payerId: 'B', receiverId: 'A', amount: 20 }
    ];

    const debts = calculatePairwiseDebts(expenses, settlements);
    expect(debts).toEqual([
      { debtorId: 'B', creditorId: 'A', amount: 40 }
    ]);
  });

  it('11. Settlement overpayment rejection', () => {
    const expenses = [
      { payerId: 'A', amount: 100, splits: [{ userId: 'B', amountOwed: 100 }] }
    ];
    const debts = calculatePairwiseDebts(expenses, []);
    
    expect(() => applySettlement('B', 'A', 150, debts))
      .toThrow('Over-settlement rejected: Amount exceeds owed debt');
  });

  it('15. User balance summary & Group balances', () => {
    const expenses = [
      {
        payerId: 'A',
        amount: 100,
        splits: [
          { userId: 'A', amountOwed: 33.33 },
          { userId: 'B', amountOwed: 33.33 },
          { userId: 'C', amountOwed: 33.34 }
        ]
      }
    ];
    
    const groupBalances = calculateGroupBalances(expenses, []);
    expect(groupBalances['A']).toBe(66.67);
    expect(groupBalances['B']).toBe(-33.33);
    expect(groupBalances['C']).toBe(-33.34);

    const debts = calculatePairwiseDebts(expenses, []);
    
    const summaryA = calculateUserSummary('A', debts);
    expect(summaryA).toEqual({
      totalOwe: 0,
      totalOwed: 66.67,
      net: 66.67
    });

    const summaryB = calculateUserSummary('B', debts);
    expect(summaryB).toEqual({
      totalOwe: 33.33,
      totalOwed: 0,
      net: -33.33
    });
  });
});
