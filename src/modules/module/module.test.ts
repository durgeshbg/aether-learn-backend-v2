import {
  setupTests,
  staticData,
  type UserOrgAdmin,
} from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import {
  PrismaClient,
  type Course,
  type Lesson,
  type Module,
  type Organization,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { ModuleErrors } from './module.errors';
import { LANGUAGES_MAP, LANG_KEYS } from '../../laguages';
import { Role } from '../../generated/prisma';

let url = '/api/v1/courses';

const { MODULE_CREATE_FAILED, MODULE_NOT_FOUND } = ModuleErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;

const {
  USER_TEST_EMAILS,
  USER_TEST_PASSWORD,
  ORGANIZATION_TEST_NAME,
  COURSE_TEST_NAME,
  LESSON_TEST_TITLE,
} = staticData;

describe('Module', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;

  let admin: UserOrgAdmin;
  let user: UserOrgAdmin;
  let user2: UserOrgAdmin;
  let adminToken: string;
  let userToken: string;
  let user2Token: string;

  let organization: Organization;
  let course: Course;
  let lesson: Lesson;
  let module: Module;

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
    course = await testDB.seedCourse(prisma, COURSE_TEST_NAME, organization.id);
    lesson = await testDB.seedLesson(prisma, LESSON_TEST_TITLE, course.id);
    module = await testDB.seedModule(
      prisma,
      lesson.id,
      staticData.MODULE_TEST_TITLE
    );

    url += `/${course.id}/lessons/${lesson.id}/modules`;

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all modules in lesson as admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.modules).toHaveLength(1);
      expect(response.body.modules[0]).toHaveProperty('id', module.id);
    });

    test('Should fetch all modules in lesson for organization admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.modules).toHaveLength(1);
      expect(response.body.modules[0]).toHaveProperty('id', module.id);
    });

    test('Should fecth all modules in lesson for user in organization', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.modules).toHaveLength(1);
      expect(response.body.modules[0]).toHaveProperty('id', module.id);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch modules for user not in organization', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.modules).toHaveLength(0);
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
      expect(response.body.module).toHaveProperty('id');
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
        .get(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.module).toHaveProperty('id', module.id);
    });

    test('Should fetch module by ID for organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.module).toHaveProperty('id', module.id);
    });

    test('Should fetch module by ID for user in organization', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.module).toHaveProperty('id', module.id);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch module by ID for user not in organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(MODULE_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(MODULE_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch module by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch module without auth', async () => {
      const response = await supertest(app).get(`${url}/${module.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update module as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Module' });
      expect(response.status).toBe(200);
      expect(response.body.module.title).toBe('Updated Module');
    });

    test('Should not update module as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Should Not Update' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update module with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${module.id}`)
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update module without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${module.id}`)
        .send({ title: 'Module' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete module as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete module with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete module without auth', async () => {
      const response = await supertest(app).delete(`${url}/${module.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });

    test('Should delete module as admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${module.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
