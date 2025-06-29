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

describe('Question', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let questionId: string;
  let quizId: string;
  let courseId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const course = await testDB.seedCourses(prisma);
    const quiz = await testDB.seedQuizzes(prisma, course.id);

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;

    courseId = course.id;
    quizId = quiz.id;
    url = `/api/v1/courses/${courseId}/quizzes/${quizId}/questions`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all questions with admin auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch questions as user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch questions without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new question as admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          text: 'What is 2+2?',
          options: ['3', '4'],
          answer: 1,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      questionId = response.body.id;
    });

    test('Should not create question as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'What is 2+2?',
          options: ['3', '4'],
          answer: 1,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create question with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: '', options: ['A'], answer: 0 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create question with invalid answer index', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'], answer: 5 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
      expect(response.body.messages[0].message).toContain('Invalid index');
    });

    test('Should not create question without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ text: 'Q', options: ['A', 'B'], answer: 1 });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', async () => {
    questionId = await prisma.question
      .create({
        data: {
          text: 'Should Not Update',
          options: ['A', 'B'],
          answer: 0,
          quiz: { connect: { id: quizId } },
        },
      })
      .then((q) => q.id);

    test('Should fetch question by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', questionId);
    });

    test('Should not fetch question with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch question as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch question without auth', async () => {
      const response = await supertest(app).get(`${url}/${questionId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update question as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Updated Q', options: ['A', 'B'], answer: 0 });
      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Updated Q');
    });

    test('Should not update question as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Should Not Update', options: ['A', 'B'], answer: 0 });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update question with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: '', options: ['A'], answer: 0 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update question with invalid answer index', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'], answer: 5 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.messages[0].message).toContain('Invalid index');
    });

    test('Should not update question with only options and no answer update', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.messages[0].message).toContain('answer is required');
    });

    test('Should not update question with only answer and no options update', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', answer: 5 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.messages[0].message).toContain(
        'options is required'
      );
    });

    test('Should not update question with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'], answer: 0 });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update question without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${questionId}`)
        .send({ text: 'Q', options: ['A', 'B'], answer: 0 });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete question as admin', async () => {
      // Create a question to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'To Delete', options: ['A', 'B'], answer: 0 });
      const delId = create.body.id;

      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete question as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete question with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete question without auth', async () => {
      const response = await supertest(app).delete(`${url}/${questionId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
