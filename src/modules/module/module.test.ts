import { setupTests } from '../../utils/testsSetup';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { ModuleErrors } from './module.errors';
import { LANGUAGES_MAP, LANG_KEYS } from '../../laguages';

let url = '/api/v1/courses';

const { MODULE_CREATE_FAILED } = ModuleErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_QUERY_PARAMS } = ValidationErrors;

describe('Module', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let moduleId: string;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    await testDB.seedUsers(prisma);
    const course = await testDB.seedCourses(prisma);
    const lesson = await testDB.seedLessons(prisma, course.id);

    url += `/${course.id}/lessons/${lesson.id}/modules`;

    const tokens = await testDB.getTokens(app);
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all modules with admin auth', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should not fetch modules as user', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch modules without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new module as admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Module',
          content: 'Some Content',
          languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      moduleId = response.body.id;
    });

    test('Should not create module as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Module',
          content: 'Some Content',
          languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create module with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Module', lessonId: 'invalid-id' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create module with invalid lesson id', async () => {
      const response = await supertest(app)
        .post(
          `/api/v1/courses/cmch6sat2000gxqxenh7e3yi7/lessons/cmch6sat2000gxqxenh7e3yi7/modules` // Mack dummy cuids
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Module',
          content: 'Some Content',
          languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id,
        });
      expect(response.status).toBe(MODULE_CREATE_FAILED.STATUS);
      expect(response.body.error).toBe(MODULE_CREATE_FAILED.MESSAGE);
    });

    test('Should not create module without auth', async () => {
      const response = await supertest(app).post(url).send({
        title: 'Test',
        content: 'Some Content',
        languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id,
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch module by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', moduleId);
    });

    test('Should not fetch module with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not fetch module as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not fetch module without auth', async () => {
      const response = await supertest(app).get(`${url}/${moduleId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update module as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Module' });
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Module');
    });

    test('Should not update module as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Should Not Update' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update module with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update module with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Module' });
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not update module without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${moduleId}`)
        .send({ title: 'Module' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete module as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete module with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY_PARAMS.MESSAGE);
    });

    test('Should not delete module without auth', async () => {
      const response = await supertest(app).delete(`${url}/${moduleId}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });

    test('Should delete module as admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
