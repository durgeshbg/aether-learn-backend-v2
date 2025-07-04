import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, CodeSolutionStatus } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';

let url = '/api/v1/courses';

const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('CodeSolution', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let codeSolutionId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const course = await testDB.seedCourses(prisma);
    const codeAssessment = await testDB.seedCodeAssessments(prisma, course.id);

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;

    url = `/api/v1/courses/${course.id}/code-assessments/${codeAssessment.id}/code-solutions`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all code solutions with admin auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch code solutions as user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch code solutions without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new code solution as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'print("Hello")' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      codeSolutionId = response.body.id;
    });

    test('Should not create code solution with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create code solution without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ code: 'print("Hello")' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /me', () => {
    test("Should fetch user's code solution", async () => {
      const response = await supertest(app)
        .get(`${url}/me`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
    });

    test("Should not fetch user's code solution without auth", async () => {
      const response = await supertest(app).get(`${url}/me`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should not fetch code solution by ID as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolutionId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch code solution with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch code solution without auth', async () => {
      const response = await supertest(app).get(`${url}/${codeSolutionId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch code solution by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolutionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', codeSolutionId);
    });
  });

  describe('PUT: /:id/score', () => {
    test('Should update code solution score as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 90 });
      expect(response.status).toBe(200);
      expect(response.body.score).toBe(90);
    });

    test('Should not update score as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/score`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 80 });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update score with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 200 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update score with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 50 });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update score without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/score`)
        .send({ score: 50 });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id/status', () => {
    test('Should update code solution status as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(CodeSolutionStatus.SUBMITTED);
    });

    test('Should not update status as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update status with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update status with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update status without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolutionId}/status`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
