import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../lib/prisma.js';

export const processCsvUpload = async (groupId, userId, file) => {
  const job = await prisma.importJob.create({
    data: {
      groupId,
      createdById: userId,
      filename: file.originalname,
      status: 'REVIEWING'
    }
  });

  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          await analyzeRows(groupId, job.id, results);
          // Delete temp file
          fs.unlinkSync(file.path);
          resolve(job);
        } catch (e) {
          reject(e);
        }
      });
  });
};

const analyzeRows = async (groupId, jobId, rows) => {
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true }
  });

  const memberNames = groupMembers.map(m => m.user.fullName.toLowerCase());
  const memberMap = {}; // mapping lowerName to userId
  groupMembers.forEach(m => memberMap[m.user.fullName.toLowerCase()] = m.user.id);

  let rowNumber = 1;
  const expenseTracker = new Set(); // to detect duplicates

  for (const row of rows) {
    rowNumber++; // Header is 1
    let issues = [];

    const dateStr = row.date;
    const desc = row.description;
    const paidBy = row.paid_by;
    const amount = row.amount;
    const currency = row.currency || 'INR';
    const splitType = row.split_type;
    const splitWith = row.split_with;
    
    // 11. Missing Required Fields
    if (!desc || !paidBy || amount === undefined || !splitWith) {
      issues.push({ type: 'MISSING_FIELDS', severity: 'ERROR', msg: 'Missing description, paid_by, amount, or split_with' });
    }

    // 5. Invalid Date
    let parsedDate;
    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM-DD
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        parsedDate = new Date(dateStr);
      }
    } else {
      parsedDate = new Date('invalid');
    }

    if (isNaN(parsedDate.getTime())) {
      issues.push({ type: 'INVALID_DATE', severity: 'ERROR', msg: `Invalid date format: ${dateStr}` });
    }

    // 4. Unknown User
    if (paidBy && !memberNames.includes(paidBy.toLowerCase().trim())) {
      issues.push({ type: 'UNKNOWN_USER', severity: 'WARNING', msg: `Payer "${paidBy}" is not in group` });
    }

    if (splitWith) {
      const splitters = splitWith.split(';');
      splitters.forEach(s => {
        if (!memberNames.includes(s.toLowerCase().trim())) {
          issues.push({ type: 'UNKNOWN_USER', severity: 'WARNING', msg: `Split participant "${s}" is not in group` });
        }
      });
    }

    // 3. Negative Amount
    const numAmount = parseFloat(amount?.replace(/,/g, ''));
    if (numAmount < 0) {
      issues.push({ type: 'NEGATIVE_AMOUNT', severity: 'WARNING', msg: 'Negative amount detected. Is this a refund?' });
    } else if (isNaN(numAmount) || amount.includes(',')) {
      issues.push({ type: 'FORMAT_ISSUE', severity: 'WARNING', msg: 'Amount formatting issue (commas or non-numeric)' });
    }

    if (numAmount === 0) {
      issues.push({ type: 'ZERO_AMOUNT', severity: 'ERROR', msg: 'Amount cannot be zero' });
    }

    // 6. Settlement Logged As Expense
    if (desc && desc.toLowerCase().includes('paid') && desc.toLowerCase().includes('back') && !splitType) {
      issues.push({ type: 'SETTLEMENT_LOGGED_AS_EXPENSE', severity: 'WARNING', msg: 'This looks like a settlement, not an expense' });
    }

    // 7. Currency Mixing
    if (currency !== 'INR') {
      issues.push({ type: 'CURRENCY_MIXING', severity: 'INFO', msg: `Non-INR currency detected (${currency}). Requires conversion.` });
    }

    // 12. Invalid split sum
    if (splitType === 'percentage' && row.split_details) {
      const details = row.split_details.split(';');
      let sum = 0;
      details.forEach(d => {
        const match = d.match(/(\d+)%/);
        if (match) sum += parseInt(match[1]);
      });
      if (sum !== 100 && sum > 0) {
        issues.push({ type: 'INVALID_SPLIT_SUM', severity: 'ERROR', msg: `Percentages sum to ${sum}% instead of 100%` });
      }
    }

    // 9 & 10. Membership date constraints
    if (!isNaN(parsedDate.getTime())) {
      if (splitWith) {
        const splitters = splitWith.split(';');
        splitters.forEach(s => {
          const member = groupMembers.find(m => m.user.fullName.toLowerCase() === s.toLowerCase().trim());
          if (member) {
            if (member.leftAt && parsedDate > member.leftAt) {
              issues.push({ type: 'MEMBERSHIP_ERROR', severity: 'ERROR', msg: `Expense date is after ${member.user.fullName} left the group` });
            }
            if (member.joinedAt && parsedDate < member.joinedAt) {
              issues.push({ type: 'MEMBERSHIP_ERROR', severity: 'ERROR', msg: `Expense date is before ${member.user.fullName} joined the group` });
            }
          }
        });
      }
    }

    // 1. & 2. Duplicates
    const expenseKey = `${dateStr}-${paidBy}-${numAmount}`;
    const descKey = `${dateStr}-${paidBy}-${desc.toLowerCase()}`;
    if (expenseTracker.has(expenseKey)) {
      issues.push({ type: 'DUPLICATE', severity: 'WARNING', msg: 'Exact match (date, payer, amount) found earlier. Potential duplicate.' });
    } else if (expenseTracker.has(descKey)) {
      issues.push({ type: 'DIFFERENT_AMOUNT_DUPLICATE', severity: 'WARNING', msg: 'Same date, payer and description but different amount found earlier.' });
    } else {
      expenseTracker.add(expenseKey);
      expenseTracker.add(descKey);
    }

    // Add issues to DB
    for (const issue of issues) {
      let suggestedAction = 'REVIEW';
      if (issue.type === 'DUPLICATE' || issue.type === 'DIFFERENT_AMOUNT_DUPLICATE') suggestedAction = 'REJECT';
      if (issue.type === 'NEGATIVE_AMOUNT') suggestedAction = 'CONVERT_TO_REFUND';
      if (issue.type === 'SETTLEMENT_LOGGED_AS_EXPENSE') suggestedAction = 'CONVERT_TO_SETTLEMENT';
      
      await prisma.importIssue.create({
        data: {
          importJobId: jobId,
          rowNumber,
          issueType: issue.type,
          severity: issue.severity,
          message: issue.msg,
          rawData: row,
          suggestedAction
        }
      });
    }

    // If perfectly clean, still insert as an INFO issue indicating it's ready, 
    // or just don't insert and process automatically on finalize.
    // For this assignment, we will just insert everything as pending if any issue exists.
    if (issues.length === 0) {
      await prisma.importIssue.create({
        data: {
          importJobId: jobId,
          rowNumber,
          issueType: 'CLEAN',
          severity: 'INFO',
          message: 'Ready to import',
          rawData: row,
          suggestedAction: 'ACCEPT'
        }
      });
    }
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { totalRows: rowNumber - 1 }
  });
};

export const finalizeImport = async (groupId, jobId) => {
  // Read all issues for this job.
  const issues = await prisma.importIssue.findMany({
    where: { importJobId: jobId }
  });

  // Group by rowNumber
  const rows = {};
  issues.forEach(issue => {
    if (!rows[issue.rowNumber]) rows[issue.rowNumber] = { rawData: issue.rawData, actions: [] };
    rows[issue.rowNumber].actions.push(issue.userAction);
  });

  // Only proceed if all issues are resolved (not PENDING)
  for (const rowNum of Object.keys(rows)) {
    if (rows[rowNum].actions.includes('PENDING')) {
      throw new Error(`Row ${rowNum} still has pending issues`);
    }
  }

  // Iterate and create actual expenses based on REJECTED_ROW, ACCEPTED_SUGGESTION, OVERRIDDEN
  for (const rowNum of Object.keys(rows)) {
    const rowIssues = issues.filter(i => i.rowNumber === parseInt(rowNum));
    const finalData = rowIssues[0].rawData; // This could be the original or overridden JSON

    const isRejected = rowIssues.some(i => i.userAction === 'REJECTED_ROW');
    if (isRejected) continue; // Skip this row

    const isSettlement = rowIssues.some(i => i.issueType === 'SETTLEMENT_LOGGED_AS_EXPENSE' && (i.userAction === 'ACCEPTED_SUGGESTION' || i.userAction === 'OVERRIDDEN'));

    // ... parsing logic to insert into DB
    try {
      const amount = parseFloat(finalData.amount?.replace(/,/g, ''));
      let date;
      if (finalData.date && finalData.date.includes('-')) {
        const parts = finalData.date.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          date = new Date(finalData.date);
        }
      } else {
        date = new Date();
      }

      // Find payer
      const groupMembers = await prisma.groupMember.findMany({ where: { groupId }, include: { user: true } });
      const payerMember = groupMembers.find(m => m.user.fullName.toLowerCase() === finalData.paid_by?.toLowerCase().trim());
      if (!payerMember) continue;

      if (isSettlement) {
        // Extract receiver from split_with
        const receiverName = finalData.split_with?.split(';')[0]?.toLowerCase().trim();
        const receiverMember = groupMembers.find(m => m.user.fullName.toLowerCase() === receiverName);
        if (receiverMember) {
          await prisma.settlement.create({
            data: {
              groupId,
              payerId: payerMember.userId,
              receiverId: receiverMember.userId,
              amount: Math.abs(amount),
              note: finalData.description,
              createdById: payerMember.userId,
              createdAt: date
            }
          });
        }
      } else {
        // Create Expense
        const currency = finalData.currency || 'INR';
        const splitType = finalData.split_type?.toUpperCase() || 'EQUAL';
        const exchangeRate = currency !== 'INR' ? 83.5 : 1;
        const finalAmountInINR = Math.abs(amount) * exchangeRate;
        
        const expense = await prisma.expense.create({
          data: {
            groupId,
            title: finalData.description,
            amount: finalAmountInINR,
            paidById: payerMember.userId,
            createdById: payerMember.userId,
            splitType: splitType === 'PERCENTAGE' ? 'PERCENTAGE' : splitType === 'SHARE' ? 'SHARE' : splitType === 'UNEQUAL' ? 'UNEQUAL' : 'EQUAL',
            currency,
            originalAmount: currency !== 'INR' ? Math.abs(amount) : null,
            exchangeRate: currency !== 'INR' ? exchangeRate : null, // Mock exchange rate or take from user
            expenseDate: date
          }
        });

        // Add Participants
        const splitWith = finalData.split_with?.split(';') || [];
        let sortOrder = 0;
        for (const s of splitWith) {
          const participantMember = groupMembers.find(m => m.user.fullName.toLowerCase() === s.toLowerCase().trim());
          if (participantMember) {
            await prisma.expenseParticipant.create({
              data: {
                expenseId: expense.id,
                userId: participantMember.userId,
                splitValue: null, // Depending on split_details
                sortOrder: sortOrder++
              }
            });
          }
        }
      }
    } catch (e) {
      console.error(`Failed to insert row ${rowNum}`, e);
    }
  }
  
  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' }
  });

  return { success: true };
};
