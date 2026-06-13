export const calculatePairwiseDebts = (expenses = [], settlements = []) => {
  const owes = {};
  
  const addDebt = (debtorId, creditorId, amount) => {
    if (debtorId === creditorId) return;
    if (!owes[debtorId]) owes[debtorId] = {};
    if (!owes[debtorId][creditorId]) owes[debtorId][creditorId] = 0;
    owes[debtorId][creditorId] += amount;
  };

  expenses.forEach(exp => {
    exp.splits.forEach(split => {
      addDebt(split.userId, exp.payerId, split.amountOwed);
    });
  });

  settlements.forEach(settle => {
    // settlement means payer paid receiver, which reduces payer's debt to receiver
    // represented as adding to receiver's debt to payer to simplify the pairwise graph
    addDebt(settle.payerId, settle.receiverId, -settle.amount);
  });

  // Simplify mutual debts
  const simplified = [];
  const getDebt = (a, b) => (owes[a] && owes[a][b]) ? owes[a][b] : 0;

  const users = new Set();
  Object.keys(owes).forEach(u => {
    users.add(u);
    Object.keys(owes[u]).forEach(v => users.add(v));
  });

  const userList = Array.from(users);
  
  for (let i = 0; i < userList.length; i++) {
    for (let j = i + 1; j < userList.length; j++) {
      const u1 = userList[i];
      const u2 = userList[j];
      
      const u1OwesU2 = getDebt(u1, u2);
      const u2OwesU1 = getDebt(u2, u1);
      
      const net = Math.round((u1OwesU2 - u2OwesU1) * 100) / 100;
      
      if (net > 0) {
        simplified.push({ debtorId: u1, creditorId: u2, amount: net });
      } else if (net < 0) {
        simplified.push({ debtorId: u2, creditorId: u1, amount: -net });
      }
    }
  }

  return simplified;
};

export const calculateGroupBalances = (expenses = [], settlements = []) => {
  const balances = {}; // userId -> net balance

  const addBalance = (userId, amount) => {
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += amount;
  };

  expenses.forEach(exp => {
    addBalance(exp.payerId, exp.amount);
    exp.splits.forEach(split => {
      addBalance(split.userId, -split.amountOwed);
    });
  });

  settlements.forEach(settle => {
    addBalance(settle.payerId, settle.amount);
    addBalance(settle.receiverId, -settle.amount);
  });

  Object.keys(balances).forEach(userId => {
    balances[userId] = Math.round(balances[userId] * 100) / 100;
    if (balances[userId] === -0) balances[userId] = 0;
  });

  return balances;
};

export const calculateUserSummary = (userId, pairwiseDebts = []) => {
  let totalOwe = 0;
  let totalOwed = 0;

  pairwiseDebts.forEach(debt => {
    if (debt.debtorId === userId) {
      totalOwe += debt.amount;
    } else if (debt.creditorId === userId) {
      totalOwed += debt.amount;
    }
  });

  return {
    totalOwe: Math.round(totalOwe * 100) / 100,
    totalOwed: Math.round(totalOwed * 100) / 100,
    net: Math.round((totalOwed - totalOwe) * 100) / 100
  };
};

export const applySettlement = (debtorId, creditorId, amount, pairwiseDebts) => {
  const debt = pairwiseDebts.find(d => d.debtorId === debtorId && d.creditorId === creditorId);
  const owedAmount = debt ? debt.amount : 0;
  
  if (amount > owedAmount + 0.001) { // Float tolerance
    throw new Error('Over-settlement rejected: Amount exceeds owed debt');
  }
  
  return { payerId: debtorId, receiverId: creditorId, amount };
};
