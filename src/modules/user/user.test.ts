import { setupTestDB } from '../../utils/testDB';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, type User } from '../../generated/prisma';
import { UserErrors } from './user.errors';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';

let cleanTestDB: () => Promise<void>;
let app: Application;
let prisma: PrismaClient;
let adminToken: string;
let userToken: string;
let userId: string;
let adminId: string;

beforeAll(async () => {
  const testDB = await setupTestDB();
  cleanTestDB = testDB.cleanDB;

  app = setupApp();

  prisma = new PrismaClient();
  testDB.seedUsers(prisma);
});

afterAll(async () => {
  await cleanTestDB();
  await prisma.$disconnect();
});

describe('User', async () => {
  describe('POST: /login', () => {
    test('Should login with right credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin@mail.com', password: 'password' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');

      const response2 = await supertest(app).post('/api/v1/users/login').send({
        email: 'user@mail.com',
        password: 'password',
      });
      expect(response2.status).toBe(200);
      expect(response2.body).toHaveProperty('token');

      adminToken = response.body.token;
      userToken = response2.body.token;
      expect(adminToken).toBeDefined();
      expect(userToken).toBeDefined();
    });

    test('Should not login with missing credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin@mail.com' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        ValidationErrors.INVALID_DATA
      );
    });

    test('Should not login with wrong credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin@mail.com', password: 'wrongpassword' });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'error',
        UserErrors.USER_INVALID_CREDENTIALS
      );
    });
  });

  describe('POST: /create', () => {
    test('Should create a new user if admin', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test2@mail.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    test('Should not create a user with existing email', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test2@mail.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        UserErrors.USER_EMAIL_EXISTS
      );
    });

    test('Should not create user if not admin', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'some@mail.com',
          password: 'password',
          firstName: 'Some',
          lastName: 'User',
        });
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', AuthErrors.FORBIDDEN);
    });
  });

  describe('GET: /', () => {
    test('Should not fetch without auth token', async () => {
      const response = await supertest(app).get('/api/v1/users');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', AuthErrors.UNAUTHORIZED);
    });

    test('Should fetch all users with auth token', async () => {
      const response = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
      // userId = response.body[0].id; // Store the first user's ID for later tests
      response.body.forEach((user: User) => {
        if (user.role === Role.ADMIN) {
          adminId = user.id;
        } else {
          userId = user.id;
        }
      });
    });

    test('Should not fetch user by invalid ID', async () => {
      const response = await supertest(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        ValidationErrors.INVALID_QUERY_PARAMS
      );
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch user by ID with auth token', async () => {
      const response = await supertest(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update user by admin', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('firstName', 'Updated');
    });

    test('Should not update user with invalid data', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: '', // Invalid first name
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        ValidationErrors.INVALID_DATA
      );
    });

    test('Should not update user if not admin', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Another Update',
        });
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', AuthErrors.FORBIDDEN);
    });
  });

  describe('PUT: /:id/organization', () => {
    test('Should update user org with invalid org id', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: 'org_1234567890abcdef', // Example organization ID
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        UserErrors.USER_INVALID_ORGANIZATION
      );
    });
  });

  describe('PUT: /:id/role', () => {
    test('Should not update user role if not admin', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', AuthErrors.FORBIDDEN);
    });

    test('Should update user role by admin', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role', Role.ADMIN);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete user if not admin', async () => {
      const response = await supertest(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', AuthErrors.FORBIDDEN);
    });

    test('Should not delete user himself', async () => {
      const response = await supertest(app)
        .delete(`/api/v1/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        'error',
        UserErrors.USER_OWN_ACCOUNT_DELETION
      );
    });

    test('Should delete user by admin', async () => {
      const response = await supertest(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
