import prisma from '../lib/prisma.js';

export const searchUser = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true, avatarUrl: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};
