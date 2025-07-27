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
  CodeSolutionStatus,
  type Organization,
  type Course,
  type CodeAssessment,
  type CodeSolution,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';

let url = '/api/v1/courses';

const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;

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
    user3 = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.user3,
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
    codeSolution = await testDB.seedCodeSolution(
      prisma,
      CODE_SOLUTION_TEST_CODE,
      codeAssessment.id,
      user2.id
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
    test('Should fetch all code solutions as admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBeGreaterThanOrEqual(1);
    });

    test('Should fetch all code solutions for assessment as org admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBeGreaterThanOrEqual(1);
    });

    test('Should fetch all code solutions for assessment as user who has access to assessment', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBe(1);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch code solutions for users not having access to assessment', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolutions).toBeInstanceOf(Array);
      expect(response.body.codeSolutions.length).toBe(0);
    });

    test('Should not fetch code solutions without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new code solution as user', async () => {
      // add user2 to the organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user3.id] });

      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${user3Token}`)
        .send({ code: 'print("Hello")' });
      expect(response.status).toBe(201);
      expect(response.body.codeSolution).toHaveProperty('id');

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
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

  describe('GET: /:id', () => {
    test('Should fetch code solution by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution).toHaveProperty('id');
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
    });

    test('Should fetch code solution by ID as org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution).toHaveProperty('id');
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
    });

    test('Should fetch code solution by ID as user who has access to assessment', async () => {
      const response = await supertest(app)
        .get(`${url}/${codeSolution.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.codeSolution.id).toBe(codeSolution.id);
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

  describe('PUT: /:id/score', () => {
    test('Should update code solution score as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ score: 90 });
      expect(response.status).toBe(200);
      expect(response.body.codeSolution.score).toBe(90);
    });

    test('Should not update score as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/score`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 80 });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update score with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/score`)
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update score without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/score`)
        .send({ score: 50 });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id/status', () => {
    test('Should update code solution status as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(200);
      expect(response.body.codeSolution.status).toBe(
        CodeSolutionStatus.SUBMITTED
      );
    });

    test('Should not update status as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update status with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/status`)
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update status without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${codeSolution.id}/status`)
        .send({ status: CodeSolutionStatus.SUBMITTED });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
