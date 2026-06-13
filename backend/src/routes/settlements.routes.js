import { Router } from 'express';
import { createSettlement, getSettlements, deleteSettlement } from '../controllers/settlements.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireGroupMember } from '../middleware/groups.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createSettlementSchema } from '../validators/settlements.validation.js';

const router = Router({ mergeParams: true });

router.use(authenticate, requireGroupMember);

router.post('/', validateRequest(createSettlementSchema), createSettlement);
router.get('/', getSettlements);
router.delete('/:settlementId', deleteSettlement);

export default router;
