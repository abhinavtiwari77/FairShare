import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import * as importController from '../controllers/importController.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Group context routes for importing
router.post('/:groupId/import', protect, upload.single('file'), importController.uploadCsv);
router.get('/:groupId/import/:jobId', protect, importController.getImportJob);
router.post('/:groupId/import/:jobId/issues/:issueId/resolve', protect, importController.resolveIssue);
router.post('/:groupId/import/:jobId/finalize', protect, importController.finalizeImport);

export default router;
