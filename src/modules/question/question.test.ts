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
  type Organization,
  type Question,
  type Quiz,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { QuestionErrors } from './question.errors';
import { Role } from '../../generated/prisma';

let url = '/api/v1/courses';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { QUESTION_NOT_FOUND } = QuestionErrors;

const {
  USER_TEST_EMAILS,
  USER_TEST_PASSWORD,
  ORGANIZATION_TEST_NAME,
  COURSE_TEST_NAME,
  QUIZ_TEST_TITLE,
  QUESTION_TEST_TEXT,
  QUESTION_TEST_OPTIONS,
  QUESTION_TEST_ANSWER,
} = staticData;

describe('Question', async () => {
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
  let quiz: Quiz;
  let question: Question;

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
    quiz = await testDB.seedQuiz(prisma, QUIZ_TEST_TITLE, course.id);
    question = await testDB.seedQuestion(
      prisma,
      quiz.id,
      QUESTION_TEST_TEXT,
      QUESTION_TEST_OPTIONS,
      QUESTION_TEST_ANSWER
    );

    url = `/api/v1/courses/${course.id}/quizzes/${quiz.id}/questions`;

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
    test('Should fetch all questions for quiz as admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions.length).toBeGreaterThan(0);
    });

    test('Should fetch all questions for quiz as organization admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions.length).toBeGreaterThan(0);
    });

    test('Should fetch all questions for quiz as organization user', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions.length).toBeGreaterThan(0);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch questions for quiz as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions.length).toBe(0);
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
      expect(response.body.question).toHaveProperty('id');
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
    test('Should fetch question by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.question).toHaveProperty('id');
      expect(response.body.question.id).toBe(question.id);
    });

    test('Should fetch question by ID as organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.question).toHaveProperty('id');
      expect(response.body.question.id).toBe(question.id);
    });

    test('Should fetch question by ID as organization user', async () => {
      // add user2 to the organization
      const a = await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.question).toHaveProperty('id');
      expect(response.body.question.id).toBe(question.id);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch question by ID as regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(QUESTION_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(QUESTION_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch question with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch question without auth', async () => {
      const response = await supertest(app).get(`${url}/${question.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update question as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Updated Q', options: ['A', 'B'], answer: 1 });
      expect(response.status).toBe(200);
      expect(response.body.question.text).toBe('Updated Q');
    });

    test('Should not update question as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Should Not Update', options: ['A', 'B'], answer: 0 });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update question with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: '', options: ['A'], answer: 0 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update question with invalid answer index', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'], answer: 5 });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.messages[0].message).toContain('Invalid index');
    });

    test('Should not update question with only options and no answer update', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Q', options: ['A', 'B'] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.messages[0].message).toContain('answer is required');
    });

    test('Should not update question with only answer and no options update', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
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
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update question without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${question.id}`)
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
        .send({ text: 'To Delete', options: ['A', 'B'], answer: 1 });
      const delId = create.body.question.id;

      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete question as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${question.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete question with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete question without auth', async () => {
      const response = await supertest(app).delete(`${url}/${question.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
