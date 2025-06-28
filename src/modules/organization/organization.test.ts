import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';

const url = '/api/v1/organizations';

const { FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('Organization', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let orgId: string;
  let userId: string;
  let courseId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    await testDB.seedCourses(prisma);

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;

    // Create a user and a course for add/remove tests
    const users = await prisma.user.findMany({ where: { role: 'USER' } });
    userId = users[0]?.id || '';
    const courses = await prisma.course.findMany();
    courseId = courses[0]?.id || '';
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all organizations for admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch all organizations if not admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new organization', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Organization' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Organization');
      orgId = response.body.id;
    });

    test('Should not create organization if not admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Organization' });
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
      expect(Array.isArray(response.body)).toBe(true);
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
        .get(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', orgId);
      expect(response.body.name).toBe('Test Organization');
    });

    test('Should not fetch organization with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch organization if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update organization', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Organization' });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Organization');
    });

    test('Should not update organization with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update organization if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Should Not Update' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id/users', () => {
    test('Should fetch all users in organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch users if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should fetch users for org admin', async () => {
      // Update user to be an org admin
      await prisma.user.update({
        where: { id: userId },
        data: { orgAdminOf: { connect: { id: orgId } } },
      });

      const response = await supertest(app)
        .get(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch users with invalid org id', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id/users', () => {
    test('Should add users to organization', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [userId] });
      expect(response.status).toBe(200);

      // Verify user was added
      const usersResponse = await supertest(app)
        .get(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.some((user: any) => user.id === userId)).toBe(
        true
      );
    });

    test('Should not add users with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['sdsdsdsdsdsdsd'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });
  });

  describe('DELETE: /:id/users', () => {
    test('Should remove users from organization', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [userId] });
      expect(response.status).toBe(200);

      // Verify user was removed
      const usersResponse = await supertest(app)
        .get(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.some((user: any) => user.id === userId)).toBe(
        false
      );
    });

    test('Should not remove users with invalid org id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [userId] });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not remove users if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgId}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [userId] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id/courses', () => {
    test('Should fetch all courses in organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch courses with invalid org id', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/courses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch courses if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id/courses', () => {
    test('Should add courses to organization', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [courseId] });
      expect(response.status).toBe(200);

      // Verify course was added
      const coursesResponse = await supertest(app)
        .get(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(coursesResponse.status).toBe(200);
      expect(
        coursesResponse.body.some((course: any) => course.id === courseId)
      ).toBe(true);
    });

    test('Should not add courses with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: ['jhjhjhjhh'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not add courses if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseIds: [courseId] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('DELETE: /:id/courses', () => {
    test('Should not remove courses if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseIds: [courseId] });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should remove courses from organization', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgId}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [courseId] });
      expect(response.status).toBe(200);
    });

    test('Should not remove courses with invalid org id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseIds: [courseId] });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete organization', async () => {
      const response = await supertest(app)
        .delete(`${url}/${orgId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete organization with invalid id', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete organization if not admin', async () => {
      // Re-create for this test
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete' });
      const newOrgId = create.body.id;

      const response = await supertest(app)
        .delete(`${url}/${newOrgId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });
});
