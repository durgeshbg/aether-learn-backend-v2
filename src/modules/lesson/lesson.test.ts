import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';

const url = '/api/v1/lessons';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('Lesson', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let lessonId: string;
  let courseId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const course = await testDB.seedCourses(prisma);
    const lesson = await testDB.seedLessons(prisma, course.id);

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;

    courseId = course.id;
    lessonId = lesson.id;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all lessons with auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch lessons if not admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch lessons without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new lesson with valid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Lesson',
          content: 'Lesson content',
          courseId: courseId,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Lesson');
      lessonId = response.body.id;
    });

    test('Should not create lesson with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', content: '', courseId: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create lesson if not admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Test', content: 'Test', courseId: courseId });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create lesson without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ title: 'Test', content: 'Test', courseId: 'courseId' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch lesson by ID', async () => {
      const response = await supertest(app)
        .get(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', lessonId);
    });

    test('Should not fetch lesson with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch lesson if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch lesson without auth', async () => {
      const response = await supertest(app).get(`${url}/${lessonId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update lesson with valid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Lesson', content: 'Updated content' });
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Lesson');
    });

    test('Should not update lesson with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', content: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update lesson with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update lesson if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update lesson without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${lessonId}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete lesson', async () => {
      // Create a lesson to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          content: 'content',
          courseId: courseId,
        });
      const delId = create.body.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete lesson with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete lesson if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${lessonId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete lesson without auth', async () => {
      const response = await supertest(app).delete(`${url}/${lessonId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
