import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';

let url = '/api/v1/courses';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('Quiz', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let quizId: string;

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

    url += `/${course.id}/quizzes`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all quizzes with admin auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch quizzes as user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch quizzes without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new quiz with valid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Quiz',
          description: 'This is a test quiz',
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Quiz');
      quizId = response.body.id;
    });

    test('Should not create quiz with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', description: 'This is a test quiz' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create quiz as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Quiz',
          description: 'This is a test quiz',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create quiz without auth', async () => {
      const response = await supertest(app).post(url).send({
        title: 'Quiz',
        description: 'This is a test quiz',
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch quiz by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', quizId);
    });

    test('Should not fetch quiz with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch quiz as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch quiz without auth', async () => {
      const response = await supertest(app).get(`${url}/${quizId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update quiz with valid data as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Quiz',
        });
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Quiz');
    });

    test('Should not update quiz with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update quiz with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Quiz',
        });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update quiz as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Quiz',
          questions: [{ question: 'Q', options: ['A'], answer: 'A' }],
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update quiz without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${quizId}`)
        .send({
          title: 'Quiz',
          questions: [{ question: 'Q', options: ['A'], answer: 'A' }],
        });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete quiz as admin', async () => {
      // Create a quiz to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          description: 'This is a test quiz',
        });
      const delId = create.body.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete quiz with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete quiz as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete quiz without auth', async () => {
      const response = await supertest(app).delete(`${url}/${quizId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
