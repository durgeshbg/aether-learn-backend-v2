import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, type Course, type Organization, type User } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { OrganizationErrors } from './organization.errors';

const url = '/api/v1/organizations';

const { FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { ORGANIZATION_NOT_FOUND } = OrganizationErrors;
const { USER_TEST_EMAILS, USER_TEST_PASSWORD, ORGANIZATION_TEST_NAME, COURSE_TEST_NAME } =
  staticData;

describe('Organization', async () => {
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
  let orgToDelete: Organization;
  let course: Course;
  let course2: Course;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();

    admin = await testDB.seedUser(prisma, USER_TEST_EMAILS.admin, Role.ADMIN, USER_TEST_PASSWORD);
    user = await testDB.seedUser(prisma, USER_TEST_EMAILS.user, Role.USER, USER_TEST_PASSWORD);
    user2 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user2, Role.USER, USER_TEST_PASSWORD);
    user3 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user3, Role.USER, USER_TEST_PASSWORD);
    organization = await testDB.seedOrganization(prisma, ORGANIZATION_TEST_NAME, user.id);
    orgToDelete = await testDB.seedOrganization(prisma, 'Delete', user2.id);
    course = await testDB.seedCourse(prisma, COURSE_TEST_NAME, organization.id);
    course2 = await testDB.seedCourse(prisma, COURSE_TEST_NAME + ' 2');

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

  describe('GET: /', () => {
    test('Should fetch all organizations for admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.organizations)).toBe(true);
    });

    test('Should not fetch all organizations if not admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch organizations if regular user', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new organization', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dummy' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Dummy');
    });

    test('Should not create organization if not admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Dummy' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create organization with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });
  });

  describe('GET: /search', () => {
    test('Should search organizations by name', async () => {
      const response = await supertest(app)
        .get(`${url}/search?name=test`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(response.body.organizations.length).toBeGreaterThan(0);
    });

    test('Should not search organizations if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/search?name=test`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch organization by ID', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.organization).toHaveProperty('id', organization.id);
      expect(response.body.organization.name).toBe('Test Organization');
    });

    test('Should not fetch organization with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should fetch organization if org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.organization).toHaveProperty('id', organization.id);
      expect(response.body.organization.name).toBe('Test Organization');
    });

    test('Should fetch organization if user in org', async () => {
      // add user2 to organization
      await supertest(app)
        .put(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.organization).toHaveProperty('id', organization.id);
      expect(response.body.organization.name).toBe('Test Organization');
      // remove user2 from organization
      await supertest(app)
        .delete(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch organization if not admin or org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(ORGANIZATION_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(ORGANIZATION_NOT_FOUND.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update organization if admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Organization' });
      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe('Updated Organization');
    });

    test('Should not update organization with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should update organization if org admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated by Org Admin' });
      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe('Updated by Org Admin');
    });

    test('Should not update organization if not admin or orgadmin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Should Not Update' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete organization with invalid id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete organization even if orgAdmin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should delete organization if admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });

  describe('GET: /:id/users', () => {
    test('Should fetch all users in organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('Should not fetch users if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should fetch users for org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('Should not fetch users with invalid org id', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id/users', () => {
    test('Should not add users with invalid org id', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not add users with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['sdsdsdsdsdsdsd'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not add users if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should add users to organization if admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(200);
      expect(response.body.organization.usersCount).toBe(2); // orgAdmin + user2

      // Verify user was added
      const usersResponse = await supertest(app)
        .get(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.users.some((user: User) => user.id === user2.id)).toBe(true);
    });
  });

  describe('DELETE: /:id/users', () => {
    test('Should not remove users with invalid org id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not remove users with invalid data', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['invalid-id'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not remove users if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should remove users from organization id admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
      expect(response.status).toBe(200);
      expect(response.body.organization.usersCount).toBe(1); // only orgAdmin remains

      // Verify user was removed
      const usersResponse = await supertest(app)
        .get(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.users.some((user: User) => user.id === user2.id)).toBe(false);
    });
  });

  describe('GET: /:id/courses', () => {
    test('Should fetch all courses in organization if admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.courses)).toBe(true);
    });

    test('Should fetch all courses in organization if org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.courses)).toBe(true);
    });

    test('Should fetch all courses if user in organization', async () => {
      // add user2 to organization
      await supertest(app)
        .put(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.courses)).toBe(true);
      expect(response.body.courses.some((course: Course) => course.id === course.id)).toBe(true);

      // remove user2 from organization
      await supertest(app)
        .delete(`${url}/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch courses with invalid org id', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/courses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch courses if not admin or org admin or user not in org', async () => {
      const response = await supertest(app)
        .get(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(ORGANIZATION_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(ORGANIZATION_NOT_FOUND.MESSAGE);
    });
  });

  describe('PUT: /:id/courses', () => {
    test('Should not add courses with invalid org id', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [course.id] });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not add courses with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: ['invalid-id'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not add courses if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseIds: [course.id] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should add courses to organization if admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [course.id, course2.id] });
      expect(response.status).toBe(200);
      expect(response.body.organization.coursesCount).toBe(2);
    });
  });

  describe('DELETE: /:id/courses', () => {
    test('Should not remove courses with invalid org id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [course.id] });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not remove courses with invalid data', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: ['invalid-id'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not remove courses if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseIds: [course.id] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should remove courses from organization if admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${organization.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [course.id, course2.id] });
      expect(response.status).toBe(200);
      expect(response.body.organization.coursesCount).toBe(0);
    });
  });
});
