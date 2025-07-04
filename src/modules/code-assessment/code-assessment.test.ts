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

describe('CodeAssessment', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let codeAssessmentId: string;

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

    url = `/api/v1/courses/${course.id}/code-assessments`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all code assessments with admin auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should fetch code assessments as user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch code assessments without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new code assessment with valid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Code Assessment',
          description: 'desc',
          instructions: 'Do this',
          starterCode: 'print("Hello")',
          languageId: 1,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Code Assessment');
      codeAssessmentId = response.body.id;
    });

    test('Should not create code assessment with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '',
          description: '',
          instructions: '',
          starterCode: '',
          languageId: -1,
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create code assessment as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test',
          description: 'desc',
          instructions: 'Do this',
          starterCode: 'print("Hello")',
          languageId: 1,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create code assessment without auth', async () => {
      const response = await supertest(app).post(url).send({
        title: 'Test',
        description: 'desc',
        instructions: 'Do this',
        starterCode: 'print("Hello")',
        languageId: 1,
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch code assessment by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', codeAssessmentId);
    });

    test('Should not fetch code assessment with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should fetch code assessment as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', codeAssessmentId);
    });

    test('Should not fetch code assessment without auth', async () => {
      const response = await supertest(app).get(`${url}/${codeAssessmentId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update code assessment with valid data as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Code Assessment' });
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Code Assessment');
    });

    test('Should not update code assessment with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update code assessment with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test' });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update code assessment as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Test' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update code assessment without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessmentId}`)
        .send({ title: 'Test' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete code assessment as admin', async () => {
      // Create a code assessment to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          description: 'desc',
          instructions: 'Do this',
          starterCode: 'print("Hello")',
          languageId: 1,
        });
      const delId = create.body.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete code assessment with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete code assessment as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${codeAssessmentId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete code assessment without auth', async () => {
      const response = await supertest(app).delete(
        `${url}/${codeAssessmentId}`
      );
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
