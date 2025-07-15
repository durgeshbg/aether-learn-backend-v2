import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, type User } from '../../generated/prisma';
import { UserErrors } from './user.errors';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const url = '/api/v1/users';

const {
  USER_EMAIL_EXISTS,
  USER_INVALID_CREDENTIALS,
  USER_OWN_ACCOUNT_DELETION,
  USER_INVALID_ORGANIZATION,
  USER_FORBIDDEN,
} = UserErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS, INTERNAL_SERVER_ERROR } =
  ValidationErrors;

describe('User', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let adminId: string;
  let organizationId: string;

  const USER_TEST_EMAILS = {
    admin: 'admin@mail.com',
    user: 'user@mail.com',
    test: 'test@mail.com',
    test2: 'test2@mail.com',
    orgAdmin: 'orgadmin@mail.com',
  };
  const USER_TEST_PASSWORD = 'password';

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const organization = await testDB.seedOrganizations(prisma);
    organizationId = organization.id;

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('POST: /login', () => {
    test('Should not login with missing credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not login with wrong credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin, password: 'wrongpassword' });
      expect(response.status).toBe(USER_INVALID_CREDENTIALS.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_INVALID_CREDENTIALS.MESSAGE
      );
    });

    // Successful login test is already covered in the setupTests function
  });

  describe('GET: /me', () => {
    test('Should not fetch user details without auth token', async () => {
      const response = await supertest(app).get(`${url}/me`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch user details with valid auth token', async () => {
      const response = await supertest(app)
        .get(`${url}/me`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
    });
  });

  describe('POST: /', () => {
    let orgAdminToken: string;

    test('Should create a new user if admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: USER_TEST_EMAILS.orgAdmin,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          organizationId: organizationId,
          orgAdmin: true,
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.organization).toHaveProperty(
        'id',
        organizationId
      );
      expect(response.body.user.orgAdminOf).toHaveProperty(
        'id',
        organizationId
      );
    });

    test('Should not create a user with existing email', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: USER_TEST_EMAILS.user,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(USER_EMAIL_EXISTS.STATUS);
      expect(response.body).toHaveProperty('error', USER_EMAIL_EXISTS.MESSAGE);
    });

    test('Should not create user if not admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: USER_TEST_EMAILS.user,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should create user if org admin', async () => {
      const orgAdminResponse = await supertest(app).post(`${url}/login`).send({
        email: USER_TEST_EMAILS.orgAdmin,
        password: USER_TEST_PASSWORD,
      });
      orgAdminToken = orgAdminResponse.body.token;
      expect(orgAdminResponse.status).toBe(200);

      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          email: USER_TEST_EMAILS.test,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.organization).toHaveProperty(
        'id',
        organizationId
      );
    });

    test('Should not create user with role as org admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          email: USER_TEST_EMAILS.test2,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          role: Role.ADMIN, // Trying to set role as ADMIN
        });
      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe(Role.USER); // Should default to USER
    });
  });

  describe('GET: /', () => {
    test('Should not fetch without auth token', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch all users with auth token', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(5); // 2 seeded users + 3 created in POST tests
      // userId = response.body[0].id; // Store the first user's ID for later tests
      response.body.users.forEach((user: User) => {
        if (user.role === Role.ADMIN) {
          adminId = user.id;
        } else {
          userId = user.id;
        }
      });
    });

    test('Should not fetch users if not admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch user by ID with auth token', async () => {
      const response = await supertest(app)
        .get(`${url}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', userId);
    });

    test('Should not fetch user by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        INVALID_QUERY_PARAMS.MESSAGE
      );
    });

    test('Should not fetch user if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /organization', () => {
    let orgAdminToken: string;

    test('Should fetch all users in organization by org admin', async () => {
      const orgAdminResponse = await supertest(app).post(`${url}/login`).send({
        email: USER_TEST_EMAILS.orgAdmin,
        password: USER_TEST_PASSWORD,
      });
      orgAdminToken = orgAdminResponse.body.token;
      expect(orgAdminResponse.status).toBe(200);

      const response = await supertest(app)
        .get(`${url}/organization`)
        .set('Authorization', `Bearer ${orgAdminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(3); // 2 seeded users + 1 created in POST tests
    });

    test('Should not fetch users in organization if not org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/organization`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should fetch users in organization by admin', async () => {
      const response = await supertest(app)
        .get(`${url}?organizationId=${organizationId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(3); // All users including org admin
    });
  });

  describe('GET: /organization/:id', () => {
    let orgAdminToken: string;
    test('Should fetch user in organization by org admin', async () => {
      const orgAdminResponse = await supertest(app).post(`${url}/login`).send({
        email: USER_TEST_EMAILS.orgAdmin,
        password: USER_TEST_PASSWORD,
      });
      orgAdminToken = orgAdminResponse.body.token;
      expect(orgAdminResponse.status).toBe(200);

      const response = await supertest(app)
        .get(`${url}/organization/${userId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', userId);
    });

    test('Should not fetch user in organization if not org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/organization/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update user name by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'Updated');
    });

    test('Should update user name by user himself', async () => {
      let userPayload = jwt.decode(userToken) as JwtPayload as any;
      const response = await supertest(app)
        .put(`${url}/${userPayload.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'User',
          lastName: 'Updated',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'User');
    });

    test('Should not update user if not admin or himself', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}`) // belogs to another user
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'NotAllowed',
          lastName: 'User',
        });
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });

    test('Should not update user with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: '', // Invalid first name
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not update user with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Invalid',
          lastName: 'User',
        });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        INVALID_QUERY_PARAMS.MESSAGE
      );
    });
  });

  describe('PUT: /:id/organization', () => {
    test('Should not update user org with invalid org id', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: 'org_1234567890abcdef', // Example organization ID
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should update user organization by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: organizationId, // Valid organization ID
        });
      expect(response.status).toBe(200);
      expect(response.body.user.organization).toHaveProperty(
        'id',
        organizationId
      );
    });

    test('Should not update user organization if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId: organizationId,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id/organization-admin', () => {
    test('Should not update user org admin status if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization-admin`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId: organizationId,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should update user org admin status by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization-admin`)
        .set('Authorization', `Bearer ${adminToken}`) // User Id is the new admin of the organization
        .send({
          organizationId: organizationId,
        });
      expect(response.status).toBe(200);
      expect(response.body.user.orgAdminOf).toHaveProperty(
        'id',
        organizationId
      );
    });

    test('Should not update user org admin status with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/organization-admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: 'invalid-org-id', // Invalid organization ID
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
  });

  describe('PUT: /:id/role', () => {
    test('Should not update user role if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should update user role by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('role', Role.ADMIN);
    });
  });

  describe('DELETE: /:id', () => {
    let normalUserIds: string;
    let orgAdminToken: string;
    test('Should not delete user if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not delete user himself', async () => {
      const response = await supertest(app)
        .delete(`${url}/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(USER_OWN_ACCOUNT_DELETION.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_OWN_ACCOUNT_DELETION.MESSAGE
      );
    });

    test('Should delete user if org admin', async () => {
      let orgAdmin: any;
      const {
        body: { users },
      } = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);

      orgAdmin = users?.find((user: any) => user.orgAdminOf);

      normalUserIds = users
        .filter(
          (user: any) =>
            user.role === Role.USER &&
            user.orgAdminOf === null &&
            user?.id !== orgAdmin?.id &&
            user?.organization?.id === orgAdmin?.organization?.id
        )
        .map((user: any) => user.id);

      const orgAdminToken = await supertest(app).post(`${url}/login`).send({
        email: orgAdmin?.email,
        password: USER_TEST_PASSWORD,
      });

      const response = await supertest(app)
        .delete(`${url}/${normalUserIds[0]}`)
        .set('Authorization', `Bearer ${orgAdminToken.body.token}`);
      expect(response.status).toBe(204);
    });

    test('Should delete user by admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${normalUserIds[1]}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
