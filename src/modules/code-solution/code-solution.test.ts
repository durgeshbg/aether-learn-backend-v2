import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import {
  PrismaClient,
  CodeSolutionStatus,
  type Organization,
  type Course,
  type CodeAssessment,
  type CodeSolution,
  type TestCase,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { CodeSolutionErrors } from './code-solution.errors';

let url = '/api/v1/courses';

const { UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { CODE_SOLUTION_NOT_FOUND, CODE_SOLUTION_QUEUED } = CodeSolutionErrors;

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
  CODE_SOLUTION_TEST_CODE,
  CODE_ASSESSMENT_TEST_RUNNER_CODE,
  TEST_CASE_TEST_DESCRIPTION,
  TEST_CASE_TEST_INPUT,
  TEST_CASE_TEST_EXPECTED,
} = staticData;

describe('CodeSolution', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;

  let admin: UserOrgAdmin;
  let adminToken: string;
  let user: UserOrgAdmin;
  let user2: UserOrgAdmin;
  let user3: UserOrgAdmin;
  let userToken: string;
  let user2Token: string;
  let user3Token: string;

  let organization: Organization;
  let course: Course;
  let codeAssessment: CodeAssessment;
  let codeSolution: CodeSolution;
  let testCase: TestCase;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();
    admin = await testDB.seedUser(prisma, USER_TEST_EMAILS.admin, Role.ADMIN, USER_TEST_PASSWORD);
    user = await testDB.seedUser(prisma, USER_TEST_EMAILS.user, Role.USER, USER_TEST_PASSWORD);
    user2 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user2, Role.USER, USER_TEST_PASSWORD);
    user3 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user3, Role.USER, USER_TEST_PASSWORD);

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
    testCase = await testDB.seedTestCase(
      prisma,
      TEST_CASE_TEST_DESCRIPTION,
      TEST_CASE_TEST_INPUT,
      TEST_CASE_TEST_EXPECTED,
      codeAssessment.id,
    );

    // Add user2 to the organization so they can create solutions
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        users: { connect: { id: user2.id } },
        usersCount: { increment: 1 },
      },
    });

    // Create enrolled course progress for user2
    await prisma.enrolledCourseProgress.create({
      data: {
        userId: user2.id,
        courseId: course.id,
      },
    });

    codeSolution = await testDB.seedCodeSolution(
      prisma,
      CODE_SOLUTION_TEST_CODE,
      codeAssessment.id,
      user2.id,
    );

    url = `/api/v1/courses/${course.id}/code-assessments/${codeAssessment.id}/code-solutions`;

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);
    user3Token = testDB.genToken({
      ...user3,
    });
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all code solutions for code assessment as admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codeSolutions');
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBeGreaterThan(0);
    });

    test('Should fetch all code solutions for code assessment as organization admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codeSolutions');
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBeGreaterThan(0);
    });

    test('Should fetch all code solutions for code assessment as organization user', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codeSolutions');
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBeGreaterThan(0);
    });

    test('Should not fetch code solutions for regular user not part of organization', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codeSolutions');
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBe(0);
    });

    test('Should not fetch code solutions without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /run', () => {
    test('Should run code solution as organization user', async () => {
      const response = await supertest(app)
        .post(`${url}/run`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(CODE_SOLUTION_QUEUED.STATUS);
      expect(response.body.message).toBe(CODE_SOLUTION_QUEUED.MESSAGE);
      expect(response.body).toHaveProperty('codeSolutionId');
    });

    test('Should run code solution as admin', async () => {
      // Create enrolled course progress for admin
      await prisma.enrolledCourseProgress.create({
        data: {
          userId: admin.id,
          courseId: course.id,
        },
      });

      const response = await supertest(app)
        .post(`${url}/run`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(CODE_SOLUTION_QUEUED.STATUS);
      expect(response.body.message).toBe(CODE_SOLUTION_QUEUED.MESSAGE);
      expect(response.body).toHaveProperty('codeSolutionId');
    });

    test('Should not run code solution with invalid data', async () => {
      const response = await supertest(app)
        .post(`${url}/run`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ code: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not run code solution without auth', async () => {
      const response = await supertest(app)
        .post(`${url}/run`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /submit', () => {
    test('Should submit code solution as organization user', async () => {
      const response = await supertest(app)
        .post(`${url}/submit`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(CODE_SOLUTION_QUEUED.STATUS);
      expect(response.body.message).toBe(CODE_SOLUTION_QUEUED.MESSAGE);
      expect(response.body).toHaveProperty('codeSolutionId');
    });

    test('Should submit code solution as admin', async () => {
      const response = await supertest(app)
        .post(`${url}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(CODE_SOLUTION_QUEUED.STATUS);
      expect(response.body.message).toBe(CODE_SOLUTION_QUEUED.MESSAGE);
      expect(response.body).toHaveProperty('codeSolutionId');
    });

    test('Should not submit code solution with invalid data', async () => {
      const response = await supertest(app)
        .post(`${url}/submit`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ code: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not submit code solution without auth', async () => {
      const response = await supertest(app)
        .post(`${url}/submit`)
        .send({ code: CODE_SOLUTION_TEST_CODE });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch code solution by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution).toHaveProperty('id');
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
      expect(response.body.codeSolution).toHaveProperty('code');
      expect(response.body.codeSolution).toHaveProperty('testCaseResults');
    });

    test('Should fetch code solution by ID as organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution).toHaveProperty('id');
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
      expect(response.body.codeSolution).toHaveProperty('code');
    });

    test('Should fetch code solution by ID as owner', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution).toHaveProperty('id');
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
      expect(response.body.codeSolution).toHaveProperty('code');
    });

    test('Should not fetch code solution by ID as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(CODE_SOLUTION_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(CODE_SOLUTION_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch code solution with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch code solution without auth', async () => {
      const response = await supertest(app).get(`${url}/${codeSolution.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id/status', () => {
    test('Should fetch code solution status as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe(CodeSolutionStatus.SUBMITTED);
    });

    test('Should fetch code solution status as organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe(CodeSolutionStatus.SUBMITTED);
    });

    test('Should fetch code solution status as owner', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe(CodeSolutionStatus.SUBMITTED);
    });

    test('Should update status to GRADED when all test case results are complete', async () => {
      const testDB = await setupTests();

      // Create a new code solution for this test
      const newCodeSolution = await testDB.seedCodeSolution(
        prisma,
        CODE_SOLUTION_TEST_CODE,
        codeAssessment.id,
        user2.id,
      );

      // Create test case result for the test case
      await testDB.seedTestCaseResult(prisma, newCodeSolution.id, testCase.id, true, '3', null);

      const response = await supertest(app)
        .get(`${url}/${newCodeSolution.id}/status`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe(CodeSolutionStatus.GRADED);
    });

    test('Should not fetch code solution status as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(CODE_SOLUTION_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(CODE_SOLUTION_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch code solution status with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/status`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch code solution status without auth', async () => {
      const response = await supertest(app).get(`${url}/${codeSolution.id}/status`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
