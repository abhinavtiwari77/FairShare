import prisma from '../lib/prisma.js';

export const createGroup = async (userId, { name, description, members }) => {
  return prisma.$transaction(async (tx) => {
    const initialMembers = [
      {
        userId,
        role: 'ADMIN'
      }
    ];

    if (members && members.length > 0) {
      members.forEach(m => {
        if (m.userId !== userId) {
          initialMembers.push({
            userId: m.userId,
            role: 'MEMBER',
            joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date()
          });
        }
      });
    }

    const group = await tx.group.create({
      data: {
        name,
        description,
        createdById: userId,
        members: {
          create: initialMembers
        }
      }
    });
    return group;
  });
};

export const getGroups = async (userId) => {
  return prisma.group.findMany({
    where: {
      archived: false,
      members: {
        some: { userId }
      }
    },
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getGroupById = async (groupId) => {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatarUrl: true }
          }
        }
      },
      _count: {
        select: { members: true }
      }
    }
  });
};

export const updateGroup = async (groupId, { name, description }) => {
  return prisma.group.update({
    where: { id: groupId },
    data: { name, description }
  });
};

export const archiveGroup = async (groupId) => {
  return prisma.group.update({
    where: { id: groupId },
    data: { archived: true, deletedAt: new Date() }
  });
};

export const addMember = async (groupId, targetUserId, joinedAt) => {
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } }
  });

  if (existing) {
    throw new Error('User is already a member of this group');
  }

  return prisma.groupMember.create({
    data: {
      groupId,
      userId: targetUserId,
      role: 'MEMBER',
      joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      }
    }
  });
};

export const removeMember = async (groupId, targetUserId) => {
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } }
  });
};

export const updateMember = async (groupId, targetUserId, { joinedAt, leftAt }) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } }
  });

  if (!membership) {
    throw new Error('Target user is not a member of this group');
  }

  const dataToUpdate = {};
  if (joinedAt !== undefined) dataToUpdate.joinedAt = new Date(joinedAt);
  if (leftAt !== undefined) {
    dataToUpdate.leftAt = leftAt === null ? null : new Date(leftAt);
  }

  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: dataToUpdate,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      }
    }
  });
};

export const transferAdmin = async (groupId, targetUserId) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } }
  });

  if (!membership) {
    throw new Error('Target user is not a member of this group');
  }

  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: 'ADMIN' }
  });
};
