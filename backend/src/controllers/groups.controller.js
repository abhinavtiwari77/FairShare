import * as groupsService from '../services/groups.service.js';
import { createGroupSchema, updateGroupSchema, addMemberSchema, transferAdminSchema } from '../validators/groups.validation.js';

export const createGroup = async (req, res) => {
  try {
    const validatedData = createGroupSchema.parse(req.body);
    const group = await groupsService.createGroup(req.user.id, validatedData);
    res.status(201).json({ group });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await groupsService.getGroups(req.user.id);
    res.json({ groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const group = await groupsService.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found', code: 'NOT_FOUND' });
    }

    const currentUserMember = group.members.find(m => m.userId === req.user.id);
    const currentUserRole = currentUserMember?.role || null;
    const isAdmin = currentUserRole === 'ADMIN';

    res.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        archived: group.archived
      },
      members: group.members,
      memberCount: group._count.members,
      currentUserRole,
      isAdmin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const validatedData = updateGroupSchema.parse(req.body);
    const group = await groupsService.updateGroup(req.params.id, validatedData);
    res.json({ group });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const archiveGroup = async (req, res) => {
  try {
    await groupsService.archiveGroup(req.params.id);
    res.json({ message: 'Group archived successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const addMember = async (req, res) => {
  try {
    const validatedData = addMemberSchema.parse(req.body);
    const member = await groupsService.addMember(req.params.id, validatedData.userId);
    res.status(201).json({ member });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    if (error.message === 'User is already a member of this group') {
      return res.status(409).json({ error: error.message, code: 'CONFLICT' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    await groupsService.removeMember(req.params.id, userId);
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    await groupsService.removeMember(req.params.id, userId);
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const transferAdmin = async (req, res) => {
  try {
    const validatedData = transferAdminSchema.parse(req.body);
    await groupsService.transferAdmin(req.params.id, validatedData.userId);
    res.json({ message: 'Admin role transferred successfully' });
  } catch (error) {
    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || error.issues?.[0]?.message || 'Validation error';
      return res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    }
    if (error.message === 'Target user is not a member of this group') {
      return res.status(404).json({ error: error.message, code: 'NOT_FOUND' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};
