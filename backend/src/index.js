import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createApp } from './app.js'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import prisma from './lib/prisma.js'
const port = process.env.PORT || 3001
const app = createApp()

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

// Attach io to app so controllers can access it
app.set('io', io)

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.request.headers.cookie || '');
    const token = cookies.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, fullName: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  // Join expense room
  socket.on('join:expense', async ({ expenseId }) => {
    try {
      // Verify expense exists and user is in the group
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          group: {
            include: {
              members: { where: { userId: socket.user.id } }
            }
          }
        }
      });

      if (!expense || expense.group.members.length === 0) {
        return socket.emit('error', 'Not authorized to join this expense chat');
      }

      socket.join(`expense:${expenseId}`);
    } catch (error) {
      console.error('Socket join error:', error);
    }
  });

  socket.on('disconnect', () => {
    // Clean up if necessary
  });
});

httpServer.listen(port, () => {
  console.log(`FairShare API listening on http://localhost:${port}`)
})
