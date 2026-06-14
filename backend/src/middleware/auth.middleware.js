import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const userCache = new Map();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (userCache.has(decoded.userId)) {
      user = userCache.get(decoded.userId);
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true, avatarUrl: true, createdAt: true }
      });
      
      if (user) {
        userCache.set(decoded.userId, user);
        // Cache for 30 seconds
        setTimeout(() => userCache.delete(decoded.userId), 30000);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found', code: 'UNAUTHORIZED' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }
    console.error('Authentication Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication', code: 'INTERNAL_ERROR' });
  }
};
