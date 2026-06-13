import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('Expense Endpoints', () => {
  const app = createApp();

  // Test state
  let adminCookies;
  let userBCookies;
  let userCCookies; // Non-member
  let adminId;
  let userBId;
  let groupId;
  let expenseIdEqual;
  let expenseIdUnequal;

  it('sets up group and users for expense tests', async () => {
    // Register A (Admin)
    const adminRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Admin User',
      email: `adminexpense_${Date.now()}@test.com`,
      password: 'password123'
    });
    adminCookies = adminRes.headers['set-cookie'];
    adminId = adminRes.body.user.id;

    // Register B (Member)
    const userBRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User B',
      email: `userbexpense_${Date.now()}@test.com`,
      password: 'password123'
    });
    userBCookies = userBRes.headers['set-cookie'];
    userBId = userBRes.body.user.id;

    // Register C (Non-member)
    const userCRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'User C',
      email: `usercexpense_${Date.now()}@test.com`,
      password: 'password123'
    });
    userCCookies = userCRes.headers['set-cookie'];

    // Create Group
    const groupRes = await request(app)
      .post('/api/v1/groups')
      .set('Cookie', adminCookies)
      .send({ name: 'Expense Group', description: 'Test' });
    groupId = groupRes.body.group.id;

    // Add B to Group
    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookies)
      .send({ userId: userBId });
  });

  it('1. Create equal expense', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Dinner',
        amount: 50.00,
        paidById: adminId,
        splitType: 'EQUAL',
        category: 'FOOD',
        participants: [
          { userId: adminId },
          { userId: userBId }
        ]
      });

    if (res.status !== 201) console.error('EQUAL EXPENSE FAIL:', res.body);
    expect(res.status).toBe(201);
    expect(res.body.expense).toBeDefined();
    expect(res.body.expense.amount).toBe('50');
    expect(res.body.expense.splitType).toBe('EQUAL');
    expenseIdEqual = res.body.expense.id;
  });

  it('2. Create unequal expense', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Groceries',
        amount: 80.00,
        paidById: adminId,
        splitType: 'UNEQUAL',
        participants: [
          { userId: adminId, value: 30 },
          { userId: userBId, value: 50 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.expense.splitType).toBe('UNEQUAL');
    expenseIdUnequal = res.body.expense.id;
  });

  it('3. Create percentage expense', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', userBCookies) // Member can create expense
      .send({
        title: 'Internet',
        amount: 60.00,
        paidById: userBId,
        splitType: 'PERCENTAGE',
        participants: [
          { userId: adminId, value: 40 },
          { userId: userBId, value: 60 }
        ]
      });

    expect(res.status).toBe(201);
  });

  it('4. Create share expense', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Rent',
        amount: 900.00,
        paidById: adminId,
        splitType: 'SHARE',
        participants: [
          { userId: adminId, value: 1 },
          { userId: userBId, value: 2 }
        ]
      });

    expect(res.status).toBe(201);
  });

  it('5. Edit expense', async () => {
    const res = await request(app)
      .patch(`/api/v1/expenses/${expenseIdEqual}`)
      .set('Cookie', adminCookies) // Admin and Creator
      .send({
        amount: 60.00,
        participants: [
          { userId: adminId },
          { userId: userBId }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.expense.amount).toBe('60');
  });

  it('7. Authorization rules (prevent non-member access)', async () => {
    const res = await request(app)
      .get(`/api/v1/expenses/${expenseIdEqual}`)
      .set('Cookie', userCCookies);
    expect(res.status).toBe(403);
  });

  it('7. Authorization rules (prevent non-creator member from editing)', async () => {
    // expenseIdUnequal was created by Admin. B is just a member.
    const res = await request(app)
      .patch(`/api/v1/expenses/${expenseIdUnequal}`)
      .set('Cookie', userBCookies)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Must be expense creator or group admin/);
  });

  it('8. Invalid split data', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set('Cookie', adminCookies)
      .send({
        title: 'Bad Split',
        amount: 100.00,
        paidById: adminId,
        splitType: 'PERCENTAGE',
        participants: [
          { userId: adminId, value: 50 },
          { userId: userBId, value: 40 } // Sums to 90
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sum to 100/);
  });

  it('9 & 10. Split persistence validation & GET /expenses/:id payload', async () => {
    const res = await request(app)
      .get(`/api/v1/expenses/${expenseIdEqual}`)
      .set('Cookie', userBCookies);

    expect(res.status).toBe(200);
    expect(res.body.expense).toBeDefined();
    expect(res.body.expense.title).toBe('Dinner');
    expect(res.body.participants).toBeInstanceOf(Array);
    expect(res.body.participants.length).toBe(2);
    expect(res.body.splits).toBeInstanceOf(Array);
    
    // Total is 60, split equally -> 30 each
    const adminSplit = res.body.splits.find(s => s.userId === adminId);
    expect(adminSplit.amountOwed).toBe('30');
    
    expect(res.body.creator.id).toBe(adminId);
    expect(res.body.payer.id).toBe(adminId);
  });

  it('6. Delete expense', async () => {
    const res = await request(app)
      .delete(`/api/v1/expenses/${expenseIdEqual}`)
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);

    // Verify it's gone
    const checkRes = await request(app)
      .get(`/api/v1/expenses/${expenseIdEqual}`)
      .set('Cookie', adminCookies);
    
    expect(checkRes.status).toBe(404);
  });
  
  it('Group expense listing supports pagination', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses?page=1&limit=2`)
      .set('Cookie', adminCookies);
      
    expect(res.status).toBe(200);
    expect(res.body.expenses).toBeInstanceOf(Array);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBe(3); // 4 created, 1 deleted
  });
});
