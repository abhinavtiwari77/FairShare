import request from 'supertest';
import { describe, expect, it, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
// No prisma import

describe('Group and Member Endpoints', () => {
  const app = createApp();
  
  let adminUser = { fullName: 'Admin User', email: `admin_${Date.now()}@test.com`, password: 'password123' };
  let memberUser = { fullName: 'Member User', email: `member_${Date.now()}@test.com`, password: 'password123' };
  let otherUser = { fullName: 'Other User', email: `other_${Date.now()}@test.com`, password: 'password123' };
  
  let adminCookie = '';
  let memberCookie = '';
  let otherCookie = '';
  
  let groupId = '';

  beforeAll(async () => {
    // Setup users
    const resA = await request(app).post('/api/v1/auth/register').send(adminUser);
    adminCookie = resA.headers['set-cookie'][0];
    adminUser.id = resA.body.user.id;

    const resM = await request(app).post('/api/v1/auth/register').send(memberUser);
    memberCookie = resM.headers['set-cookie'][0];
    memberUser.id = resM.body.user.id;

    const resO = await request(app).post('/api/v1/auth/register').send(otherUser);
    otherCookie = resO.headers['set-cookie'][0];
    otherUser.id = resO.body.user.id;
  });

  it('creates a new group', async () => {
    const response = await request(app)
      .post('/api/v1/groups')
      .set('Cookie', adminCookie)
      .send({ name: 'Test Group', description: 'A test group' });

    expect(response.status).toBe(201);
    expect(response.body.group).toBeDefined();
    expect(response.body.group.name).toBe('Test Group');
    groupId = response.body.group.id;
  });

  it('gets group by ID with formatting', async () => {
    const response = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.group).toBeDefined();
    expect(response.body.members).toBeDefined();
    expect(response.body.memberCount).toBe(1);
    expect(response.body.currentUserRole).toBe('ADMIN');
    expect(response.body.isAdmin).toBe(true);
  });

  it('searches for a user by email', async () => {
    const response = await request(app)
      .get(`/api/v1/users/search?email=${memberUser.email}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(memberUser.email);
    expect(response.body.user.id).toBe(memberUser.id);
  });

  it('adds a member to the group as ADMIN', async () => {
    const response = await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookie)
      .send({ userId: memberUser.id });

    expect(response.status).toBe(201);
    expect(response.body.member.role).toBe('MEMBER');
  });

  it('prevents adding a duplicate member', async () => {
    const response = await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookie)
      .send({ userId: memberUser.id });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });

  it('prevents non-admin from adding members', async () => {
    const response = await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', memberCookie) // member is not an admin
      .send({ userId: otherUser.id });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('prevents non-member from viewing group', async () => {
    const response = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Cookie', otherCookie); // not a member

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('removes a member as ADMIN', async () => {
    // Add other user first
    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookie)
      .send({ userId: otherUser.id });

    const response = await request(app)
      .delete(`/api/v1/groups/${groupId}/members/${otherUser.id}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
  });

  it('allows member to leave the group', async () => {
    const response = await request(app)
      .post(`/api/v1/groups/${groupId}/leave`)
      .set('Cookie', memberCookie);

    expect(response.status).toBe(200);

    // Verify they are gone
    const getRes = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Cookie', adminCookie);
    
    expect(getRes.body.memberCount).toBe(1); // Only admin left
  });

  it('transfers admin role', async () => {
    // Read member first
    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Cookie', adminCookie)
      .send({ userId: memberUser.id });

    const response = await request(app)
      .patch(`/api/v1/groups/${groupId}/admin`)
      .set('Cookie', adminCookie)
      .send({ userId: memberUser.id });

    expect(response.status).toBe(200);

    // Verify member is now admin
    const getRes = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Cookie', memberCookie);
    
    expect(getRes.body.isAdmin).toBe(true);
  });

  it('archives the group', async () => {
    // memberUser is now an admin
    const response = await request(app)
      .delete(`/api/v1/groups/${groupId}`)
      .set('Cookie', memberCookie);

    expect(response.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/groups`)
      .set('Cookie', memberCookie);

    // shouldn't appear in list of unarchived groups
    const found = getRes.body.groups.find(g => g.id === groupId);
    expect(found).toBeUndefined();
  });
});
