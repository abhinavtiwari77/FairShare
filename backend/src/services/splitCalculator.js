export const calculateExpenseSplits = (totalAmount, splitType, participants) => {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }

  const splits = [];
  let currentSum = 0;

  if (splitType === 'EQUAL') {
    const splitAmount = Math.floor((totalAmount / participants.length) * 100) / 100;
    
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      let amountOwed = splitAmount;
      
      // Add remainder to the last person
      if (i === participants.length - 1) {
        amountOwed = Math.round((totalAmount - currentSum) * 100) / 100;
      }
      
      splits.push({ userId: p.userId, amountOwed });
      currentSum += amountOwed;
    }
  } else if (splitType === 'UNEQUAL') {
    let providedSum = 0;
    for (const p of participants) {
      if (typeof p.value !== 'number') throw new Error('Value required for UNEQUAL split');
      providedSum += p.value;
      splits.push({ userId: p.userId, amountOwed: p.value });
    }
    
    // Provide a small tolerance for JS float math
    if (Math.abs(providedSum - totalAmount) > 0.001) {
      throw new Error(`Unequal split amounts must sum to total amount (${totalAmount})`);
    }
  } else if (splitType === 'PERCENTAGE') {
    let percentageSum = 0;
    for (const p of participants) {
      if (typeof p.value !== 'number') throw new Error('Value required for PERCENTAGE split');
      percentageSum += p.value;
    }
    
    if (Math.abs(percentageSum - 100) > 0.001) {
      throw new Error('Percentages must sum to 100');
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      let amountOwed = Math.floor((totalAmount * (p.value / 100)) * 100) / 100;
      
      if (i === participants.length - 1) {
        amountOwed = Math.round((totalAmount - currentSum) * 100) / 100;
      }
      
      splits.push({ userId: p.userId, amountOwed });
      currentSum += amountOwed;
    }
  } else if (splitType === 'SHARE') {
    let totalShares = 0;
    for (const p of participants) {
      if (typeof p.value !== 'number') throw new Error('Value required for SHARE split');
      totalShares += p.value;
    }
    
    if (totalShares <= 0) {
      throw new Error('Total shares must be greater than zero');
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      let amountOwed = Math.floor((totalAmount * (p.value / totalShares)) * 100) / 100;
      
      if (i === participants.length - 1) {
        amountOwed = Math.round((totalAmount - currentSum) * 100) / 100;
      }
      
      splits.push({ userId: p.userId, amountOwed });
      currentSum += amountOwed;
    }
  } else {
    throw new Error('Unsupported split type');
  }

  return splits;
};
