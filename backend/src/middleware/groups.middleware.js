import prisma from '../lib/prisma.js';

export const requireGroupMember = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: not a group member', code: 'FORBIDDEN' });
    }

    req.membership = membership;
    next();
  } catch (_error) {
    return res.status(500).json({ error: 'Internal server error checking membership', code: 'INTERNAL_ERROR' });
  }
};

export const requireGroupAdmin = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: requires admin role', code: 'FORBIDDEN' });
    }

    req.membership = membership;
    next();
  } catch (_error) {
    return res.status(500).json({ error: 'Internal server error checking admin status', code: 'INTERNAL_ERROR' });
  }
};
