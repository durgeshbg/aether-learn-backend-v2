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

const {
  USER_EMAIL_EXISTS,
  USER_INVALID_CREDENTIALS,
  USER_OWN_ACCOUNT_DELETION,
  USER_INVALID_ORGANIZATION,
} = UserErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS, INTERNAL_SERVER_ERROR } =
  ValidationErrors;

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
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not login with wrong credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/users/login')
        .send({ email: 'admin@mail.com', password: 'wrongpassword' });
      expect(response.status).toBe(USER_INVALID_CREDENTIALS.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_INVALID_CREDENTIALS.MESSAGE
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
      expect(response.status).toBe(USER_EMAIL_EXISTS.STATUS);
      expect(response.body).toHaveProperty('error', USER_EMAIL_EXISTS.MESSAGE);
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
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /', () => {
    test('Should not fetch without auth token', async () => {
      const response = await supertest(app).get('/api/v1/users');
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
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
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        INVALID_QUERY_PARAMS.MESSAGE
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
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not update user if not admin', async () => {
      const response = await supertest(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Another Update',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
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
      expect(response.status).toBe(USER_INVALID_ORGANIZATION.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_INVALID_ORGANIZATION.MESSAGE
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
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
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
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not delete user himself', async () => {
      const response = await supertest(app)
        .delete(`/api/v1/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(USER_OWN_ACCOUNT_DELETION.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_OWN_ACCOUNT_DELETION.MESSAGE
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
