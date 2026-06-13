import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireGroupMember, requireGroupAdmin } from '../middleware/groups.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', groupsController.createGroup);
router.get('/', groupsController.getGroups);
router.get('/:id', requireGroupMember, groupsController.getGroupById);
router.patch('/:id', requireGroupAdmin, groupsController.updateGroup);
router.delete('/:id', requireGroupAdmin, groupsController.archiveGroup);

router.post('/:id/members', requireGroupAdmin, groupsController.addMember);
router.delete('/:id/members/:userId', requireGroupAdmin, groupsController.removeMember);
router.post('/:id/leave', requireGroupMember, groupsController.leaveGroup);
router.patch('/:id/admin', requireGroupAdmin, groupsController.transferAdmin);

export default router;
