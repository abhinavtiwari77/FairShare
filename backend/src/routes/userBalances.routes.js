import { Router } from 'express';
import { getUserBalances } from '../controllers/balances.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Mounted at /api/v1/users/me/balances
router.get('/', authenticate, getUserBalances);

export default router;
