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
  type CodeAssessment,
  type Course,
  type Organization,
  type TestCase,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { TestCaseErrors } from './test-case.errors';

let url = '/api/v1/courses';

const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { TEST_CASE_NOT_FOUND } = TestCaseErrors;

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
  TEST_CASE_TEST_DESCRIPTION,
  TEST_CASE_TEST_EXPECTED,
  TEST_CASE_TEST_INPUT,
} = staticData;

describe('TestCase', async () => {
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
  let testCase: TestCase;

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
    codeAssessment = await testDB.seedCodeAssessment(
      prisma,
      course.id,
      CODE_ASSESSMENT_TEST_TITLE,
      CODE_ASSESSMENT_TEST_DESCRIPTION,
      CODE_ASSESSMENT_TEST_INSTRUCTIONS,
      CODE_ASSESSMENT_TEST_STARTER_CODE,
      CODE_ASSESSMENT_TEST_LANGUAGE_ID
    );
    testCase = await testDB.seedTestCase(
      prisma,
      TEST_CASE_TEST_DESCRIPTION,
      TEST_CASE_TEST_INPUT,
      TEST_CASE_TEST_EXPECTED,
      codeAssessment.id
    );

    url = `/api/v1/courses/${course.id}/code-assessments/${codeAssessment.id}/test-cases`;

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
    test('Should fetch all test cases for code assessment as admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('testCases');
      expect(response.body.testCases.length).toBeGreaterThan(0);
    });

    test('Should fetch all test cases for code assessment as organization admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('testCases');
      expect(response.body.testCases.length).toBeGreaterThan(0);
    });

    test('Should fetch all test cases for code assessment as organization user', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('testCases');
      expect(response.body.testCases.length).toBeGreaterThan(0);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch test cases for code assessment as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('testCases');
      expect(response.body.testCases.length).toBe(0);
    });

    test('Should not fetch test cases without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new test case as admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          input: '2 2',
          expected: '4',
          description: 'Addition test',
        });
      expect(response.status).toBe(201);
      expect(response.body.testCase).toHaveProperty('id');
    });

    test('Should not create test case as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          input: '2 2',
          expected: '4',
          description: 'Addition test',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create test case with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ input: '', expected: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create test case without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ input: '2 2', expected: '4' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch test case by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.testCase).toHaveProperty('id');
      expect(response.body.testCase.id).toBe(testCase.id);
    });

    test('Should fetch test case by ID as organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.testCase).toHaveProperty('id');
      expect(response.body.testCase.id).toBe(testCase.id);
    });

    test('Should fetch test case by ID as organization user', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.testCase).toHaveProperty('id');
      expect(response.body.testCase.id).toBe(testCase.id);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch test case by ID as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(TEST_CASE_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(TEST_CASE_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch test case with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch test case without auth', async () => {
      const response = await supertest(app).get(`${url}/${testCase.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update test case as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ input: '3 3', expected: '6' });
      expect(response.status).toBe(200);
      expect(response.body.testCase.input).toBe('3 3');
      expect(response.body.testCase.expected).toBe('6');
    });

    test('Should not update test case as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ input: '4 4', expected: '8' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update test case with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ input: '', expected: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update test case with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ input: '5 5', expected: '10' });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update test case without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${testCase.id}`)
        .send({ input: '6 6', expected: '12' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete test case as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete test case with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete test case without auth', async () => {
      const response = await supertest(app).delete(`${url}/${testCase.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });

    test('Should delete test case as admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${testCase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
