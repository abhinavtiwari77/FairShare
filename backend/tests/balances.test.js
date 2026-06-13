import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma';

describe('Balances Endpoints', () => {
  const app = createApp();
  let adminCookies;
  let userBCookies;
  let groupId;
  let adminId, userBId;
  const adminEmail = `adminbal_${Date.now()}_${Math.random()}@test.com`;
  const userBEmail = `userbbal_${Date.now()}_${Math.random()}@test.com`;

  beforeAll(async () => {
    // 1. Setup users
    await request(app).post('/api/v1/auth/register').send({ fullName: 'Admin', email: adminEmail, password: 'password123' });
    const resA = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'password123' });
    adminCookies = resA.headers['set-cookie'];
    adminId = resA.body.user.id;

    await request(app).post('/api/v1/auth/register').send({ fullName: 'User B', email: userBEmail, password: 'password123' });
    const resB = await request(app).post('/api/v1/auth/login').send({ email: userBEmail, password: 'password123' });
    userBCookies = resB.headers['set-cookie'];
    userBId = resB.body.user.id;

    // 2. Setup group
    const groupRes = await request(app)
      .post('/api/v1/groups')
      .set('Cookie', adminCookies)
      .send({ name: 'Balance Test Group' });
    groupId = groupRes.body.group.id;

    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookies)
      .send({ userId: userBId });

    // 3. Setup expenses (Admin pays $100, split equally -> User B owes Admin $50)
    const expRes = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Lunch',
        amount: 100,
        paidById: adminId,
        splitType: 'EQUAL',
        category: 'FOOD',
        participants: [
          { userId: adminId },
          { userId: userBId }
        ]
      });
    if(expRes.status !== 201) console.error("EXPENSE CREATION FAILED", expRes.body);
  }, 30000);

  afterAll(async () => {
    await prisma.expenseSplit.deleteMany({ where: { expense: { groupId } } });
    await prisma.expenseParticipant.deleteMany({ where: { expense: { groupId } } });
    await prisma.expense.deleteMany({ where: { groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.group.deleteMany({ where: { id: groupId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userBEmail] } }
    });
  });

  it('1. GET /api/v1/groups/:groupId/balances computes balances correctly', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/balances`)
      .set('Cookie', userBCookies);

    expect(res.status).toBe(200);
    expect(res.body.pairwiseDebts).toBeDefined();
    expect(res.body.memberBalances).toBeDefined();

    // User B owes Admin $50
    const debt = res.body.pairwiseDebts.find(d => d.debtorId === userBId && d.creditorId === adminId);
    expect(debt).toBeDefined();
    expect(debt.amount).toBe(50);
  });

  it('2. GET /api/v1/users/me/balances computes user summary correctly', async () => {
    const res = await request(app)
      .get(`/api/v1/users/me/balances`)
      .set('Cookie', userBCookies);

    expect(res.status).toBe(200);
    expect(res.body.totalOwe).toBe(50);
    expect(res.body.totalOwed).toBe(0);
    expect(res.body.netBalance).toBe(-50);
  });
});
