import prisma from '../lib/prisma.js';

export const getMessages = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        expenseId,
        deletedAt: null
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      text: msg.message,
      sender: msg.sender,
      createdAt: msg.createdAt
    }));

    return res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('GET MESSAGES ERROR:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const newMessage = await prisma.message.create({
      data: {
        expenseId,
        senderId: userId,
        message: text
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    const formattedMessage = {
      id: newMessage.id,
      text: newMessage.message,
      sender: newMessage.sender,
      createdAt: newMessage.createdAt
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`expense:${expenseId}`).emit('message:new', formattedMessage);
    }

    return res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('CREATE MESSAGE ERROR:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { expenseId, messageId } = req.params;
    const userId = req.user.id;
    const membership = req.membership;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message || message.expenseId !== expenseId || message.deletedAt) {
      return res.status(404).json({ error: 'Message not found', code: 'NOT_FOUND' });
    }

    if (message.senderId !== userId && membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Cannot delete other users messages unless admin', code: 'FORBIDDEN' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`expense:${expenseId}`).emit('message:deleted', { messageId });
    }

    return res.status(200).json({ success: true, messageId });
  } catch (error) {
    console.error('DELETE MESSAGE ERROR:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};
