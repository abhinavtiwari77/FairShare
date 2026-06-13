import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import bcrypt from 'bcrypt';

describe('Authentication Endpoints', () => {
  const app = createApp();
  let validUser = {
    fullName: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };
  let authCookie = null;

  it('rejects registration with invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects registration with short password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects registration with missing fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: validUser.email }); // missing fullName, password

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('successfully registers a user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(validUser.email);
    expect(response.body.user.passwordHash).toBeUndefined(); // verify security

    // verify JWT cookie set correctly
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.*?;/);
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('rejects duplicate email registration', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });

  it('verifies password is encrypted in database', async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: validUser.email } });
    expect(dbUser).toBeDefined();
    expect(dbUser.passwordHash).not.toBe(validUser.password);
    
    const isValid = await bcrypt.compare(validUser.password, dbUser.passwordHash);
    expect(isValid).toBe(true);
  });

  it('successfully logs in and sets cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(validUser.email);
    expect(response.body.user.passwordHash).toBeUndefined();

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = cookies[0].split(';')[0]; // Extract token=...
  });

  it('rejects login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('allows access to protected route /auth/me with valid cookie', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(validUser.email);
  });

  it('rejects access to protected route without cookie', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('successfully logs out and clears cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=;/); // value should be empty
  });
});
