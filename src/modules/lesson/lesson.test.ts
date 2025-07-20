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
  type Organization,
} from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { LessonErrors } from './lesson.errors';
import { Role } from '../../generated/prisma';

let url = '/api/v1/courses';

const { UNAUTHORIZED, FORBIDDEN } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;
const { LESSON_NOT_FOUND } = LessonErrors;
const {
  USER_TEST_EMAILS,
  USER_TEST_PASSWORD,
  ORGANIZATION_TEST_NAME,
  COURSE_TEST_NAME,
  LESSON_TEST_TITLE,
} = staticData;

describe('Lesson', async () => {
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

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);

    url = `${url}/${course.id}/lessons`;
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('GET: /', () => {
    test('Should fetch all lessons in course for admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.lessons).toBeInstanceOf(Array);
      expect(response.body.lessons.length).toBeGreaterThan(0);
    });

    test('Should fetch all lessons in course for organization admin', async () => {
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.lessons).toBeInstanceOf(Array);
      expect(response.body.lessons.length).toBeGreaterThan(0);
    });

    test('Should fetch all lessons in course for regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.lessons).toBeInstanceOf(Array);
      expect(response.body.lessons.length).toBeGreaterThan(0);

      // Clean up: remove user2 from organization
      const r = await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch lessons for regular user not part of org', async () => {      
      const response = await supertest(app)
        .get(url)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.lessons).toBeInstanceOf(Array);
      expect(response.body.lessons.length).toBe(0);
    });

    test('Should not fetch lessons without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new lesson with valid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Lesson',
          content: 'Lesson content',
          courseId: course.id,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Lesson');
    });

    test('Should not create lesson with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', content: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not create lesson if not admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Test', content: 'Test' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create lesson without auth', async () => {
      const response = await supertest(app)
        .post(url)
        .send({ title: 'Test', content: 'Test' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch lesson by ID for admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.lesson).toHaveProperty('id', lesson.id);
    });

    test('Should fetch lesson by ID for organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.lesson).toHaveProperty('id', lesson.id);
    });

    test('Should fetch lesson by ID for regular user part of org', async () => {
      // add user 2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.lesson).toHaveProperty('id', lesson.id);

      // Clean up: remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch lesson by ID for regular user not part of org', async () => {
      const response = await supertest(app)
        .get(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(LESSON_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(LESSON_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch lesson by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch lesson without auth', async () => {
      const response = await supertest(app).get(`${url}/${lesson.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update lesson with valid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Lesson', content: 'Updated content' });
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Lesson');
    });

    test('Should not update lesson with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '', content: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update lesson with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not update lesson if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update lesson without auth', async () => {
      const response = await supertest(app)
        .put(`${url}/${lesson.id}`)
        .send({ title: 'Lesson', content: 'Content' });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete lesson', async () => {
      // Create a lesson to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          content: 'content',
        });
      const delId = create.body.id;
      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete lesson with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });

    test('Should not delete lesson if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${lesson.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete lesson without auth', async () => {
      const response = await supertest(app).delete(`${url}/${lesson.id}`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });
  });
});
