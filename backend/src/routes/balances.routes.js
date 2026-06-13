import { Router } from 'express';
import { getGroupBalances, getUserBalances } from '../controllers/balances.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireGroupMember } from '../middleware/groups.middleware.js';

const router = Router({ mergeParams: true });

// Mounted at /api/v1/groups/:groupId/balances
router.get('/', authenticate, requireGroupMember, getGroupBalances);

// Wait, getUserBalances is mounted at /api/v1/users/me/balances. We need a separate router.
export default router;
