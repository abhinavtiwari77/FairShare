import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import * as importController from '../controllers/importController.js';

const router = Router({ mergeParams: true });
const upload = multer({ dest: 'uploads/' });

// Group context routes for importing
router.post('/', authenticate, upload.single('file'), importController.uploadCsv);
router.get('/:jobId', authenticate, importController.getImportJob);
router.post('/:jobId/issues/:issueId/resolve', authenticate, importController.resolveIssue);
router.post('/:jobId/finalize', authenticate, importController.finalizeImport);

export default router;
