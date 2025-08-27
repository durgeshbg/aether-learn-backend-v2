import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, type Course, type Organization, type Quiz } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { QuizErrors } from './quiz.errors';

let url = '/api/v1/courses';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { QUIZ_NOT_FOUND } = QuizErrors;

const {
  USER_TEST_EMAILS,
  USER_TEST_PASSWORD,
  ORGANIZATION_TEST_NAME,
  COURSE_TEST_NAME,
  QUIZ_TEST_TITLE,
} = staticData;

describe('Quiz', async () => {
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
    quiz = await testDB.seedQuiz(prisma, QUIZ_TEST_TITLE, course.id);

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);

    url += `/${course.id}/quizzes`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all quizzes in course for admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizzes).toBeInstanceOf(Array);
      expect(response.body.quizzes.length).toBeGreaterThan(0);
    });

    test('Should fetch all quizzes in course for organization admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizzes).toBeInstanceOf(Array);
      expect(response.body.quizzes.length).toBeGreaterThan(0);
    });

    test('Should fetch all quizzes in course for regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quizzes).toBeInstanceOf(Array);
      expect(response.body.quizzes.length).toBeGreaterThan(0);

      // Clean up: remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch quizzes for regular user not part of org', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quizzes).toBeInstanceOf(Array);
      expect(response.body.quizzes.length).toBe(0);
    });

    test('Should not fetch quizzes without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new quiz with valid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Quiz',
          description: 'This is a test quiz',
        });
      expect(response.status).toBe(201);
      expect(response.body.quiz).toHaveProperty('id');
      expect(response.body.quiz.title).toBe('Test Quiz');

      // Verify quizcount incremented in course
      const response2 = await supertest(app)
        .get(`/api/v1/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response2.status).toBe(200);
      expect(response2.body.course.quizzesCount).toBe(2);
    });

    test('Should not create quiz with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', description: 'This is a test quiz' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create quiz as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Quiz',
          description: 'This is a test quiz',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create quiz without auth', async () => {
      const response = await supertest(app).post(url).send({
        title: 'Quiz',
        description: 'This is a test quiz',
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch quiz by ID for admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quiz).toHaveProperty('id');
      expect(response.body.quiz.title).toBe(quiz.title);
    });

    test('Should fetch quiz by ID for organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quiz).toHaveProperty('id');
      expect(response.body.quiz.title).toBe(quiz.title);
    });

    test('Should fetch quiz by ID for regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quiz).toHaveProperty('id');
      expect(response.body.quiz.title).toBe(quiz.title);

      // Clean up: remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch quiz by ID for regular user not part of org', async () => {
      const response = await supertest(app)
        .get(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(QUIZ_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(QUIZ_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch quiz with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch quiz without auth', async () => {
      const response = await supertest(app).get(`${url}/${quiz.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update quiz with valid data as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Quiz',
        });
      expect(response.status).toBe(200);
      expect(response.body.quiz.title).toBe('Updated Quiz');
    });

    test('Should not update quiz with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update quiz with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Quiz',
        });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update quiz as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Quiz',
          questions: [{ question: 'Q', options: ['A'], answer: 'A' }],
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update quiz without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${quiz.id}`)
        .send({
          title: 'Quiz',
          questions: [{ question: 'Q', options: ['A'], answer: 'A' }],
        });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete quiz as admin', async () => {
      // Create a quiz to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          description: 'This is a test quiz',
        });
      const delId = create.body.quiz.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete quiz with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete quiz as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${quiz.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete quiz without auth', async () => {
      const response = await supertest(app).delete(`${url}/${quiz.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
