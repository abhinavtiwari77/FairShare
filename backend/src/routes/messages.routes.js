import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireExpenseAccess } from '../middleware/expenses.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createMessageSchema } from '../validators/messages.validation.js';
import * as messagesController from '../controllers/messages.controller.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireExpenseAccess);

router.get('/', messagesController.getMessages);
router.post('/', validateRequest(createMessageSchema), messagesController.createMessage);
router.delete('/:messageId', messagesController.deleteMessage);

export default router;
