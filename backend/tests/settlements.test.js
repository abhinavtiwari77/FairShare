import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma';

describe('Settlements Endpoints', () => {
  const app = createApp();
  let adminCookies, userBCookies;
  let groupId;
  let adminId, userBId;
  let settlementId;
  const adminEmail = `adminset_${Date.now()}_${Math.random()}@test.com`;
  const userBEmail = `userbset_${Date.now()}_${Math.random()}@test.com`;

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({ fullName: 'Admin', email: adminEmail, password: 'password123' });
    const resA = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'password123' });
    adminCookies = resA.headers['set-cookie'];
    adminId = resA.body.user.id;

    await request(app).post('/api/v1/auth/register').send({ fullName: 'User B', email: userBEmail, password: 'password123' });
    const resB = await request(app).post('/api/v1/auth/login').send({ email: userBEmail, password: 'password123' });
    userBCookies = resB.headers['set-cookie'];
    userBId = resB.body.user.id;

    const groupRes = await request(app).post('/api/v1/groups').set('Cookie', adminCookies).send({ name: 'Settlement Group' });
    groupId = groupRes.body.group.id;

    await request(app).post(`/api/v1/groups/${groupId}/members`).set('Cookie', adminCookies).send({ userId: userBId });

    // Admin pays $100 -> User B owes $50
    await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Dinner', amount: 100, paidById: adminId, splitType: 'EQUAL',
        participants: [{ userId: adminId }, { userId: userBId }]
      });
  }, 30000);

  afterAll(async () => {
    await prisma.settlement.deleteMany({ where: { groupId } });
    await prisma.expenseSplit.deleteMany({ where: { expense: { groupId } } });
    await prisma.expenseParticipant.deleteMany({ where: { expense: { groupId } } });
    await prisma.expense.deleteMany({ where: { groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.group.deleteMany({ where: { id: groupId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userBEmail] } }
    });
  });

  it('1. Prevent over-settlement', async () => {
    // User B owes Admin 50. If User B tries to settle 60, it should fail
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/settlements`)
      .set('Cookie', userBCookies)
      .send({ receiverId: adminId, amount: 60 });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Over-settlement/);
  });

  it('2. Create partial settlement', async () => {
    // User B settles 20
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/settlements`)
      .set('Cookie', userBCookies)
      .send({ receiverId: adminId, amount: 20 });
    
    expect(res.status).toBe(201);
    expect(Number(res.body.settlement.amount)).toBe(20);
    settlementId = res.body.settlement.id;
  });

  it('3. Balances are correctly updated after partial settlement', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/balances`)
      .set('Cookie', userBCookies);

    // Initial debt was 50. Paid 20. Remaining is 30.
    const debt = res.body.pairwiseDebts.find(d => d.debtorId === userBId && d.creditorId === adminId);
    expect(debt.amount).toBe(30);
  });

  it('4. Create exact settlement for remainder', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/settlements`)
      .set('Cookie', userBCookies)
      .send({ receiverId: adminId, amount: 30 });
    
    expect(res.status).toBe(201);
  });

  it('5. Balances show 0 debt after exact settlement', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/balances`)
      .set('Cookie', userBCookies);
      
    const debt = res.body.pairwiseDebts.find(d => d.debtorId === userBId && d.creditorId === adminId);
    expect(debt).toBeUndefined(); // Debt no longer exists since it's 0
  });

  it('6. Delete settlement and verify recalculation', async () => {
    // Admin deletes the partial settlement (20)
    const delRes = await request(app)
      .delete(`/api/v1/groups/${groupId}/settlements/${settlementId}`)
      .set('Cookie', adminCookies);
      
    expect(delRes.status).toBe(200);

    // Balances should now reflect that User B owes 20 again
    const balRes = await request(app)
      .get(`/api/v1/groups/${groupId}/balances`)
      .set('Cookie', userBCookies);
      
    const debt = balRes.body.pairwiseDebts.find(d => d.debtorId === userBId && d.creditorId === adminId);
    expect(debt.amount).toBe(20);
  });
});
