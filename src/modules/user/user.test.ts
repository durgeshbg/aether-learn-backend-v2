import {
  setupTests,
  type UserOrgAdmin,
  staticData,
} from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import {
  PrismaClient,
  type Organization,
  type User,
} from '../../generated/prisma';
import { UserErrors } from './user.errors';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';

const url = '/api/v1/users';

const {
  USER_EMAIL_EXISTS,
  USER_INVALID_CREDENTIALS,
  USER_OWN_ACCOUNT_DELETION,
  USER_FORBIDDEN,
} = UserErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;

const { USER_TEST_EMAILS, USER_TEST_PASSWORD, ORGANIZATION_TEST_NAME } =
  staticData;

describe('User', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let admin: UserOrgAdmin;
  let user: UserOrgAdmin;
  let user2: UserOrgAdmin;
  let user3: UserOrgAdmin;
  let adminToken: string;
  let userToken: string;
  let user2Token: string;
  let user3Token: string;
  let organization: Organization;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();

    admin = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.admin,
      Role.ADMIN,
      USER_TEST_PASSWORD
    );
    user = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.user,
      Role.USER,
      USER_TEST_PASSWORD
    );
    user2 = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.user2,
      Role.USER,
      USER_TEST_PASSWORD
    );
    organization = await testDB.seedOrganization(
      prisma,
      ORGANIZATION_TEST_NAME,
      user.id
    );
    user3 = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.user3,
      Role.USER,
      USER_TEST_PASSWORD,
      organization.id
    );

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);
    user3Token = testDB.genToken(user3);
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

    test('Should login with valid credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin, password: USER_TEST_PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('GET: /', () => {
    test('Should not fetch without auth token', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch all users with admin auth token', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(4);
    });

    test('Should fetch all users with for admin with org id query params', async () => {
      const response = await supertest(app)
        .get(`${url}?organizationId=${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(1);
    });

    test('Should fetch if org admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(1); // Only user3 should be returned
    });

    test('Should not fetch users if not admin or not regular user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new user if admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'random@mail.com',
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('random@mail.com');
      expect(response.body.user.role).toBe(Role.USER);
      expect(response.body.user.organizationId).toBeUndefined();
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
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: USER_TEST_EMAILS.user4,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should create user if org admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: USER_TEST_EMAILS.user4,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          role: Role.ADMIN,
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.organization).toHaveProperty(
        'id',
        organization.id
      );
      expect(response.body.user.role).toBe(Role.USER); // Should default to USER
    });
  });

  describe('GET: /:id', async () => {
    test('Should fetch user by ID with admin token', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user.id);
    });

    test('Should fetch user if org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user3.id);
    });

    test('Should fetch user if user himself', async () => {
      const response = await supertest(app)
        .get(`${url}/${user2.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user2.id);
    });

    test('Should not fetch user by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch user if not admin or org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });

    test('Should not fetch user if user himself tries to access another user', async () => {
      const response = await supertest(app)
        .get(`${url}/${user2.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update user name by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'Updated');
    });

    test('Should update user by org admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'OrgAdmin',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'OrgAdmin');
    });

    test('Should update user name by user himself', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'User',
          lastName: 'Updated',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'User');
    });

    test('Should not update user if not admin or org admin himself', async () => {
      const response = await supertest(app)
        .put(`${url}/${user3.id}`) // belogs to another user
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          firstName: 'NotAllowed',
          lastName: 'User',
        });
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });

    test('Should not update user with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email', // Invalid email format
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id/organization', () => {
    test('Should not update user org with invalid org id', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: 'org_1234567890abcdef', // Example organization ID
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not update user organization if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId: organization.id,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should update user organization by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: organization.id, // Valid organization ID
        });
      expect(response.status).toBe(200);
      expect(response.body.user.organization).toHaveProperty(
        'id',
        organization.id
      );
    });
  });

  describe('PUT: /:id/role', () => {
    test('Should not update user role if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not update user role with invalid role', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE', // Invalid role
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should update user role by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('role', Role.ADMIN);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete user if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not delete user himself', async () => {
      const response = await supertest(app)
        .delete(`${url}/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(USER_OWN_ACCOUNT_DELETION.STATUS);
      expect(response.body).toHaveProperty(
        'error',
        USER_OWN_ACCOUNT_DELETION.MESSAGE
      );
    });

    test('Should delete user if org admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(204);
    });

    test('Should delete user by admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
