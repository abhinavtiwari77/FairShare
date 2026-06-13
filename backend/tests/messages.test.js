import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as ioClient } from 'socket.io-client';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer);
app.set('io', io);

// Replicate socket authentication middleware
io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.request.headers.cookie || '');
    const token = cookies.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.on('join:expense', async ({ expenseId }) => {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { group: { include: { members: { where: { userId: socket.user.id } } } } }
    });
    if (!expense || expense.group.members.length === 0) {
      return socket.emit('error', 'Not authorized');
    }
    socket.join(`expense:${expenseId}`);
  });
});

let port;
beforeAll(async () => {
  await new Promise(resolve => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  io.close();
  await new Promise(resolve => httpServer.close(resolve));
});

describe('Messages & Chat APIs', () => {
  let adminCookies;
  let userBCookies;
  let userCCookies; 
  let adminId;
  let userBId;
  let groupId;
  let expenseId;
  let messageId;
  let clientSocket;

  beforeAll(async () => {
    const timestamp = Date.now();
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Admin User', email: `adminmsg_${timestamp}@test.com`, password: 'password123'
    });
    adminCookies = adminRes.headers['set-cookie'];
    adminId = adminRes.body.user.id;

    const userBRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User B', email: `userbmsg_${timestamp}@test.com`, password: 'password123'
    });
    userBCookies = userBRes.headers['set-cookie'];
    userBId = userBRes.body.user.id;

    const userCRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User C', email: `usercmsg_${timestamp}@test.com`, password: 'password123'
    });
    userCCookies = userCRes.headers['set-cookie'];

    const groupRes = await request(app)
      .post('/api/v1/groups').set('Cookie', adminCookies)
      .send({ name: 'Message Group', description: 'Test' });
    groupId = groupRes.body.group.id;

    await request(app)
      .post(`/api/v1/groups/${groupId}/members`).set('Cookie', adminCookies)
      .send({ userId: userBId });

    const expRes = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`).set('Cookie', adminCookies)
      .send({
        title: 'Dinner', amount: 100, paidById: adminId, splitType: 'EQUAL', category: 'FOOD',
        participants: [{ userId: adminId }, { userId: userBId }]
      });
    expenseId = expRes.body.expense.id;
  }, 30000);

  afterAll(() => {
    if (clientSocket) clientSocket.close();
  });

  it('1. Reject unauthorized access (User C)', async () => {
    const res = await request(app)
      .post(`/api/v1/expenses/${expenseId}/messages`).set('Cookie', userCCookies)
      .send({ text: 'Hello' });
    expect(res.status).toBe(403);
  });

  it('2. Member can post a message and broadcast socket event', async () => {
    // Setup socket client for User B
    const cookieStr = userBCookies[0].split(';')[0];
    clientSocket = ioClient(`http://localhost:${port}`, {
      extraHeaders: { Cookie: cookieStr }
    });

    await new Promise((resolve) => {
      clientSocket.on('connect', resolve);
    });

    clientSocket.emit('join:expense', { expenseId });

    const messagePromise = new Promise((resolve) => {
      clientSocket.on('message:new', (msg) => {
        resolve(msg);
      });
    });

    // Need slight delay for join room
    await new Promise(r => setTimeout(r, 100));

    const res = await request(app)
      .post(`/api/v1/expenses/${expenseId}/messages`)
      .set('Cookie', userBCookies)
      .send({ text: 'Thanks for dinner!' });

    expect(res.status).toBe(201);
    expect(res.body.message.text).toBe('Thanks for dinner!');
    messageId = res.body.message.id;

    const socketMsg = await messagePromise;
    expect(socketMsg.text).toBe('Thanks for dinner!');
    expect(socketMsg.id).toBe(messageId);
  });

  it('3. Member can fetch messages', async () => {
    const res = await request(app).get(`/api/v1/expenses/${expenseId}/messages`).set('Cookie', adminCookies);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].text).toBe('Thanks for dinner!');
  });

  it('4. Member cannot delete other user message', async () => {
    const res = await request(app).delete(`/api/v1/expenses/${expenseId}/messages/${messageId}`).set('Cookie', userCCookies);
    expect(res.status).toBe(403);
  });

  it('5. Sender can delete own message and broadcast socket event', async () => {
    const delPromise = new Promise((resolve) => {
      clientSocket.on('message:deleted', (data) => resolve(data));
    });

    const res = await request(app).delete(`/api/v1/expenses/${expenseId}/messages/${messageId}`).set('Cookie', userBCookies);
    expect(res.status).toBe(200);

    const data = await delPromise;
    expect(data.messageId).toBe(messageId);
  });
});
