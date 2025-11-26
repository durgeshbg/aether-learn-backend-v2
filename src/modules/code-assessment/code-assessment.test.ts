import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import {
  DifficultyLevel,
  PrismaClient,
  type CodeAssessment,
  type Course,
  type Organization,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { CodeAssessmentErrors } from './code-assessment.errors';

let url = '/api/v1/courses';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { CODE_ASSESSMENT_NOT_FOUND } = CodeAssessmentErrors;

const {
  USER_TEST_EMAILS,
  USER_TEST_PASSWORD,
  ORGANIZATION_TEST_NAME,
  COURSE_TEST_NAME,
  CODE_ASSESSMENT_TEST_TITLE,
  CODE_ASSESSMENT_TEST_DESCRIPTION,
  CODE_ASSESSMENT_TEST_INSTRUCTIONS,
  CODE_ASSESSMENT_TEST_STARTER_CODE,
  CODE_ASSESSMENT_TEST_LANGUAGE_ID,
  CODE_ASSESSMENT_TEST_RUNNER_CODE,
} = staticData;

describe('CodeAssessment', async () => {
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
  let codeAssessment: CodeAssessment;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();

    admin = await testDB.seedUser(prisma, USER_TEST_EMAILS.admin, Role.ADMIN, USER_TEST_PASSWORD);
    user = await testDB.seedUser(prisma, USER_TEST_EMAILS.user, Role.USER, USER_TEST_PASSWORD);

    user2 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user2, Role.USER, USER_TEST_PASSWORD);

    organization = await testDB.seedOrganization(prisma, ORGANIZATION_TEST_NAME, user.id);
    course = await testDB.seedCourse(prisma, COURSE_TEST_NAME, organization.id);
    codeAssessment = await testDB.seedCodeAssessment(
      prisma,
      course.id,
      CODE_ASSESSMENT_TEST_TITLE,
      CODE_ASSESSMENT_TEST_DESCRIPTION,
      CODE_ASSESSMENT_TEST_INSTRUCTIONS,
      CODE_ASSESSMENT_TEST_STARTER_CODE,
      CODE_ASSESSMENT_TEST_RUNNER_CODE,
      CODE_ASSESSMENT_TEST_LANGUAGE_ID,
    );

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);

    url = `/api/v1/courses/${course.id}/code-assessments`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all code assessments in course for admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessments).toBeInstanceOf(Array);
      expect(response.body.codeAssessments.length).toBeGreaterThan(0);
    });

    test('Should fetch all code assessments in course for organization admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessments).toBeInstanceOf(Array);
      expect(response.body.codeAssessments.length).toBeGreaterThan(0);
    });

    test('Should fetch all code assessments in course for regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessments).toBeInstanceOf(Array);
      expect(response.body.codeAssessments.length).toBeGreaterThan(0);

      // Clean up: remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch code assessments for regular user not part of org', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessments).toBeInstanceOf(Array);
      expect(response.body.codeAssessments.length).toBe(0);
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
          difficulty: DifficultyLevel.BEGINNER,
          runnerCode: 'console.log("Hello")',
        });
      expect(response.status).toBe(201);
      expect(response.body.codeAssessment).toHaveProperty('id');
      expect(response.body.codeAssessment.title).toBe('Test Code Assessment');

      // Verify that code assessment count in course is incremented
      const response2 = await supertest(app)
        .get(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response2.status).toBe(200);
      expect(response2.body.course.codeAssessmentsCount).toBe(2);
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
        .get(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessment).toHaveProperty('id');
      expect(response.body.codeAssessment.title).toBe(CODE_ASSESSMENT_TEST_TITLE);
    });

    test('Should fetch code assessment by ID as organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessment).toHaveProperty('id');
      expect(response.body.codeAssessment.title).toBe(CODE_ASSESSMENT_TEST_TITLE);
    });

    test('Should fetch code assessment by ID as regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeAssessment).toHaveProperty('id');
      expect(response.body.codeAssessment.title).toBe(CODE_ASSESSMENT_TEST_TITLE);

      // Clean up: remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch code assessment by ID as regular user not part of org', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(CODE_ASSESSMENT_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(CODE_ASSESSMENT_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch code assessment with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch code assessment without auth', async () => {
      const response = await supertest(app).get(`${url}/${codeAssessment.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update code assessment with valid data as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Code Assessment' });
      expect(response.status).toBe(200);
      expect(response.body.codeAssessment.title).toBe('Updated Code Assessment');
    });

    test('Should not update code assessment with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessment.id}`)
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update code assessment as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Test' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update code assessment without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeAssessment.id}`)
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
          title: 'Code Assessment to Delete',
          description: 'desc',
          instructions: 'Do this',
          starterCode: 'print("Hello")',
          languageId: 1,
          difficulty: DifficultyLevel.BEGINNER,
          runnerCode: 'console.log("Hello")',
        });
      const delId = create.body.codeAssessment.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete code assessment with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete code assessment as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${codeAssessment.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete code assessment without auth', async () => {
      const response = await supertest(app).delete(`${url}/${codeAssessment.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
