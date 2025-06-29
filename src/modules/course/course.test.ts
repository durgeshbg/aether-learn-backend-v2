import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';

const url = '/api/v1/courses';

const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('Course', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let courseId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const course = await testDB.seedCourses(prisma);

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;

    courseId = course?.id;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all courses with auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch courses without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new course as admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Course', description: 'desc' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      courseId = response.body.id;
    });

    test('Should not create course as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Course', description: 'desc' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create course with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', description: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch course by ID', async () => {
      const response = await supertest(app)
        .get(`${url}/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', courseId);
      expect(response.body).toHaveProperty('name');
    });

    test('Should not fetch course with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update course as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Course', description: 'Updated desc' });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Course');
    });

    test('Should not update course as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Should Not Update', description: 'desc' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update course with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', description: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update course with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Course', description: 'desc' });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete course as admin', async () => {
      // Create a course to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete', description: 'desc' });
      const delId = create.body.id;

      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete course as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete course with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });
  });
});
