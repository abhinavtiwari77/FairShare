import { prisma } from '../lib/prisma.js';
import * as importService from '../services/importService.js';
import fs from 'fs';

export const uploadCsv = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    // Ensure user is in group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const job = await importService.processCsvUpload(groupId, req.user.id, file);

    res.status(202).json({ 
      message: 'File uploaded and is being processed. Review anomalies.',
      jobId: job.id
    });
  } catch (error) {
    next(error);
  }
};

export const getImportJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        issues: {
          orderBy: { rowNumber: 'asc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const resolveIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { action, editedData } = req.body; // action: ACCEPTED_SUGGESTION, REJECTED_ROW, OVERRIDDEN

    const updatedIssue = await prisma.importIssue.update({
      where: { id: issueId },
      data: {
        userAction: action,
        resolvedAt: new Date(),
        rawData: editedData || undefined // Update data if overridden
      }
    });

    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
};

export const finalizeImport = async (req, res, next) => {
  try {
    const { groupId, jobId } = req.params;

    // Call service to write to Expenses and Settlements
    const result = await importService.finalizeImport(groupId, jobId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
