import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
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
  type QuizResult,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { QuizResultErrors } from './quiz-result.errors';

let url = '/api/v1/quizzes';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { QUIZ_MAX_ATTEMPTS_REACHED } = QuizResultErrors;

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

describe('QuizResult', async () => {
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
  let quizResult: QuizResult;

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
    question = await testDB.seedQuestion(
      prisma,
      quiz.id,
      QUESTION_TEST_TEXT,
      QUESTION_TEST_OPTIONS,
      QUESTION_TEST_ANSWER,
    );
    quizResult = await testDB.seedQuizResult(prisma, quiz.id, user2.id);

    url = `/api/v1/courses/${course.id}/quizzes/${quiz.id}/quiz-results`;

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
    test('Should fetch all quiz results as admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResults).toBeInstanceOf(Array);
      expect(response.body.quizResults.length).toBeGreaterThanOrEqual(1);
    });

    test('Should fetch all quiz results for quiz as org admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResults).toBeInstanceOf(Array);
      expect(response.body.quizResults.length).toBeGreaterThanOrEqual(1);
    });

    test('Should fecth all quiz results for quiz as user who has access to quiz', async () => {
      // add user2 to the organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResults).toBeInstanceOf(Array);
      expect(response.body.quizResults.length).toBe(1);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch quiz results for users not having access to quiz', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResults).toBeInstanceOf(Array);
      expect(response.body.quizResults.length).toBe(0);
    });

    test('Should not fetch quiz results without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new quiz result with valid data', async () => {
      // add user2 to the organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      // Enroll user2 to the course
      await supertest(app)
        .put('/api/v1/users/enroll-course')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ courseId: course.id });

      // Create a quiz result for user2
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          answers: [{ questionId: question.id, answer: QUESTION_TEST_ANSWER }],
        });
      expect(response.status).toBe(201);
      expect(response.body.quizResult).toHaveProperty('id');
      expect(response.body.quizResult.score).toBe(100);

      // Verify if quiz is completed for user2
      const response2 = await supertest(app)
        .get(`/api/v1/users/${user2.id}/progress`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response2.status).toBe(200);
      expect(response2.body.progress[0].completedQuizzes.some((q: Quiz) => q.id === quiz.id)).toBe(
        true,
      );

      // Verify if course is completed for user2
      const response3 = await supertest(app)
        .get(`/api/v1/users/${user2.id}/progress`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response3.status).toBe(200);
      expect(response3.body.progress[0].completionRate).toBe(100);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not create a quiz results more than the default max attempts of a quiz', async () => {
      // add user2 to the organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      // Enroll user2 to the course
      await supertest(app)
        .put('/api/v1/users/enroll-course')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ courseId: course.id });

      // Create three quiz results for user2 (max attempts reached) 1 seeded + 1 in POST test
      const res = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          answers: [{ questionId: question.id, answer: QUESTION_TEST_ANSWER }],
        });
      expect(res.status).toBe(201);
      expect(res.body.quizResult).toHaveProperty('id');
      expect(res.body.quizResult.score).toBe(100);

      // Create fourth quiz result for user2 (should fail)
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          answers: [{ questionId: question.id, answer: QUESTION_TEST_ANSWER }],
        });
      expect(response.status).toBe(QUIZ_MAX_ATTEMPTS_REACHED.STATUS);
      expect(response.body.error).toBe(QUIZ_MAX_ATTEMPTS_REACHED.MESSAGE);

      // Verify if quiz is completed for user2
      const response2 = await supertest(app)
        .get(`/api/v1/users/${user2.id}/progress`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response2.status).toBe(200);
      expect(response2.body.progress[0].completedQuizzes.some((q: Quiz) => q.id === quiz.id)).toBe(
        true,
      );

      // Verify if course is completed for user2
      const response3 = await supertest(app)
        .get(`/api/v1/users/${user2.id}/progress`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response3.status).toBe(200);
      expect(response3.body.progress[0].completionRate).toBe(100);

      // remove user2 from the organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not create quiz result with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answers: [{ questionId: 'invalid', answer: 0 }] });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create quiz result without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ answers: [{ questionId: 'invalid', answer: 0 }] });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch quiz result by ID as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${quizResult.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResult).toHaveProperty('id');
      expect(response.body.quizResult.id).toBe(quizResult.id);
    });

    test('Should fetch quiz result by ID as org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${quizResult.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResult).toHaveProperty('id');
      expect(response.body.quizResult.id).toBe(quizResult.id);
    });

    test('Should fetch quiz result by ID as user', async () => {
      const response = await supertest(app)
        .get(`${url}/${quizResult.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.quizResult.id).toBe(quizResult.id);
    });

    test('Should not fetch quiz result with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch quiz result without auth', async () => {
      const response = await supertest(app).get(`${url}/${quizResult.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete quiz result as admin', async () => {
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          answers: [{ questionId: question.id, answer: QUESTION_TEST_ANSWER }],
        });
      const delId = create.body.quizResult.id;

      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete quiz result as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${quizResult.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete quiz result with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete quiz result without auth', async () => {
      const response = await supertest(app).delete(`${url}/${quizResult.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
