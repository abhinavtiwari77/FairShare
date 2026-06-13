import { describe, expect, it } from 'vitest';
import { calculateExpenseSplits } from '../src/services/splitCalculator.js';

describe('splitCalculator', () => {
  it('1. Equal split', () => {
    const participants = [{ userId: 'A' }, { userId: 'B' }];
    const splits = calculateExpenseSplits(100, 'EQUAL', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 50 },
      { userId: 'B', amountOwed: 50 }
    ]);
  });

  it('2. Equal split with remainder', () => {
    const participants = [{ userId: 'A' }, { userId: 'B' }, { userId: 'C' }];
    const splits = calculateExpenseSplits(100, 'EQUAL', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 33.33 },
      { userId: 'B', amountOwed: 33.33 },
      { userId: 'C', amountOwed: 33.34 }
    ]);
  });

  it('3. Unequal split', () => {
    const participants = [
      { userId: 'A', value: 30 },
      { userId: 'B', value: 70 }
    ];
    const splits = calculateExpenseSplits(100, 'UNEQUAL', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 30 },
      { userId: 'B', amountOwed: 70 }
    ]);
  });

  it('4. Unequal validation failure', () => {
    const participants = [
      { userId: 'A', value: 30 },
      { userId: 'B', value: 60 }
    ];
    expect(() => calculateExpenseSplits(100, 'UNEQUAL', participants))
      .toThrow('Unequal split amounts must sum to total amount (100)');
  });

  it('5. Percentage split', () => {
    const participants = [
      { userId: 'A', value: 20 },
      { userId: 'B', value: 80 }
    ];
    const splits = calculateExpenseSplits(100, 'PERCENTAGE', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 20 },
      { userId: 'B', amountOwed: 80 }
    ]);
  });

  it('6. Percentage rounding', () => {
    const participants = [
      { userId: 'A', value: 33.33 },
      { userId: 'B', value: 33.33 },
      { userId: 'C', value: 33.34 }
    ];
    const splits = calculateExpenseSplits(10, 'PERCENTAGE', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 3.33 },
      { userId: 'B', amountOwed: 3.33 },
      { userId: 'C', amountOwed: 3.34 }
    ]);
  });

  it('7. Share split', () => {
    const participants = [
      { userId: 'A', value: 1 },
      { userId: 'B', value: 2 }
    ];
    const splits = calculateExpenseSplits(90, 'SHARE', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 30 },
      { userId: 'B', amountOwed: 60 }
    ]);
  });

  it('8. Payer included', () => {
    const participants = [{ userId: 'A' }, { userId: 'B' }];
    const splits = calculateExpenseSplits(100, 'EQUAL', participants);
    expect(splits).toEqual([
      { userId: 'A', amountOwed: 50 },
      { userId: 'B', amountOwed: 50 }
    ]);
  });

  it('9. Payer excluded', () => {
    const participants = [{ userId: 'B' }, { userId: 'C' }];
    const splits = calculateExpenseSplits(100, 'EQUAL', participants);
    expect(splits).toEqual([
      { userId: 'B', amountOwed: 50 },
      { userId: 'C', amountOwed: 50 }
    ]);
  });
});
