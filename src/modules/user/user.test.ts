import { setupTests, type UserOrgAdmin, staticData } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import {
  PrismaClient,
  type Course,
  type Lesson,
  type Module,
  type Organization,
} from '../../generated/prisma';
import { UserErrors } from './user.errors';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import type { Application } from 'express';

const url = '/api/v1/users';

const {
  USER_EMAIL_EXISTS,
  USER_INVALID_CREDENTIALS,
  USER_OWN_ACCOUNT_DELETION,
  USER_FORBIDDEN,
  USER_COURSE_ENROLLMENT_FAILED,
  USER_MODULE_BOOKMARK_FAILED,
  USER_MARK_AS_COMPLETE_FAILED,
} = UserErrors;
const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS } = ValidationErrors;

const { USER_TEST_EMAILS, USER_TEST_PASSWORD, ORGANIZATION_TEST_NAME } = staticData;

describe('User', async () => {
  let cleanTestDB: () => Promise<void>;
  let app: Application;
  let prisma: PrismaClient;
  let admin: UserOrgAdmin;
  let user: UserOrgAdmin;
  let user2: UserOrgAdmin;
  let user3: UserOrgAdmin;
  let adminToken: string;
  let userToken: string;
  let user2Token: string;
  let user3Token: string;
  let organization: Organization;
  let course: Course;
  let noAccessCourse: Course;
  let lesson: Lesson;
  let noAccessLesson: Lesson;
  let module: Module;
  let noAccessModule: Module;

  beforeAll(async () => {
    const testDB = await setupTests();
    cleanTestDB = testDB.cleanDB;

    app = setupApp();

    prisma = new PrismaClient();

    admin = await testDB.seedUser(prisma, USER_TEST_EMAILS.admin, Role.ADMIN, USER_TEST_PASSWORD);
    user = await testDB.seedUser(prisma, USER_TEST_EMAILS.user, Role.USER, USER_TEST_PASSWORD);
    user2 = await testDB.seedUser(prisma, USER_TEST_EMAILS.user2, Role.USER, USER_TEST_PASSWORD);
    organization = await testDB.seedOrganization(prisma, ORGANIZATION_TEST_NAME, user.id);
    course = await testDB.seedCourse(prisma, 'Test Course', organization.id);
    noAccessCourse = await testDB.seedCourse(prisma, 'No Access Course');
    lesson = await testDB.seedLesson(prisma, 'Test Lesson', course.id);
    noAccessLesson = await testDB.seedLesson(prisma, 'No Access Lesson', noAccessCourse.id);
    module = await testDB.seedModule(prisma, lesson.id, 'Test Module');
    noAccessModule = await testDB.seedModule(prisma, noAccessLesson.id, 'No Access Module');
    user3 = await testDB.seedUser(
      prisma,
      USER_TEST_EMAILS.user3,
      Role.USER,
      USER_TEST_PASSWORD,
      organization.id,
    );

    adminToken = testDB.genToken(admin);
    userToken = testDB.genToken({
      ...user,
      orgAdminOf: { id: organization.id },
    });
    user2Token = testDB.genToken(user2);
    user3Token = testDB.genToken(user3);
  });

  afterAll(async () => {
    await cleanTestDB();
    await prisma.$disconnect();
  });

  describe('POST: /login', () => {
    test('Should not login with missing credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not login with wrong credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin, password: 'wrongpassword' });
      expect(response.status).toBe(USER_INVALID_CREDENTIALS.STATUS);
      expect(response.body).toHaveProperty('error', USER_INVALID_CREDENTIALS.MESSAGE);
    });

    test('Should login with valid credentials', async () => {
      const response = await supertest(app)
        .post(`${url}/login`)
        .send({ email: USER_TEST_EMAILS.admin, password: USER_TEST_PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('PUT: /enroll-course', () => {
    test('Should not enroll in course without auth token', async () => {
      const response = await supertest(app).put(`${url}/enroll-course`).send({
        courseId: 'course_1234567890abcdef',
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });
    test('Should not enroll in course with missing courseId', async () => {
      const response = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
    test('Should not enroll in course with invalid course id with auth', async () => {
      const response = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: 'course1',
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
    test('Should not enroll in course which the organization does not have access', async () => {
      const response = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: noAccessCourse.id,
        });
      expect(response.status).toBe(USER_COURSE_ENROLLMENT_FAILED.STATUS);
      expect(response.body).toHaveProperty('error', USER_COURSE_ENROLLMENT_FAILED.MESSAGE);
    });
    test('Should enroll and unenroll in course with valid course id with auth and access to course', async () => {
      const response = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.enrollmentData).toHaveProperty('userId', user.id);
      expect(response.body.enrollmentData).toHaveProperty('course.id', course.id);

      const response2 = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: false,
        });

      expect(response2.status).toBe(204);
    });
    test('Should ensure enrollment is idempotent', async () => {
      const response = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.enrollmentData).toHaveProperty('userId', user.id);
      expect(response.body.enrollmentData).toHaveProperty('course.id', course.id);

      const response2 = await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: true,
        });

      expect(response2.status).toBe(200);
      expect(response2.body.enrollmentData).toHaveProperty('userId', user.id);
      expect(response2.body.enrollmentData).toHaveProperty('course.id', course.id);
    });
  });

  describe('PUT: /bookmark-module', () => {
    test('Should not bookmark module without auth token', async () => {
      const response = await supertest(app).put(`${url}/bookmark-module`).send({
        moduleId: 'module_1234567890abcdef',
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });
    test('Should not bookmark module with missing moduleId', async () => {
      const response = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
    test('Should not bookmark module with invalid module id with auth', async () => {
      const response = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: 'module1',
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
    test('Should not bookmark module which the organization does not have access', async () => {
      const response = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: noAccessModule.id,
        });
      expect(response.status).toBe(USER_MODULE_BOOKMARK_FAILED.STATUS);
      expect(response.body).toHaveProperty('error', USER_MODULE_BOOKMARK_FAILED.MESSAGE);
    });
    test('Should bookmark and remove bookmark from module with valid module id with auth and access to  module', async () => {
      const response = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: module.id,
          bookmark: true,
        });
      expect(response.status).toBe(200);
      expect(response.body.bookmark.module).toHaveProperty('id', module.id);

      const response2 = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: module.id,
          bookmark: false,
        });
      expect(response2.status).toBe(204);
    });
    test('Should ensure bookmark is idempotent', async () => {
      const response = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: module.id,
          bookmark: true,
        });
      expect(response.status).toBe(200);
      expect(response.body.bookmark.module).toHaveProperty('id', module.id);

      const response2 = await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: module.id,
          bookmark: true,
        });
      expect(response2.status).toBe(200);
      expect(response2.body.bookmark.module).toHaveProperty('id', module.id);
    });
  });

  describe('PUT: /mark-module-as-complete', () => {
    test('Should not mark module as complete without auth token', async () => {
      const response = await supertest(app).put(`${url}/mark-module-as-complete`).send({
        moduleId: 'module_1234567890abcdef',
      });
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });

    test('Should not mark module as complete with missing data', async () => {
      const response = await supertest(app)
        .put(`${url}/mark-module-as-complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not mark module as complete with invalid module id with auth', async () => {
      const response = await supertest(app)
        .put(`${url}/mark-module-as-complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: 'module1',
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });
    test('Should not mark as complete module if not enrolled in course', async () => {
      const response = await supertest(app)
        .put(`${url}/mark-module-as-complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: noAccessCourse.id,
          moduleId: noAccessModule.id,
          complete: true,
        });
      expect(response.status).toBe(USER_MARK_AS_COMPLETE_FAILED.STATUS);
      expect(response.body).toHaveProperty('error', USER_MARK_AS_COMPLETE_FAILED.MESSAGE);
    });

    test('Should mark as complete for accessible module, quiz', async () => {
      await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: true,
        });
      const response = await supertest(app)
        .put(`${url}/mark-module-as-complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          moduleId: module.id,
          complete: true,
        });
      expect(response.status).toBe(200);
      expect(response.body.progress.completedModules.some((m: Module) => m.id === module.id)).toBe(
        true,
      );
    });
  });

  describe('GET: /', () => {
    test('Should not fetch without auth token', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch all users with admin auth token', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(4);
    });

    test('Should fetch all users with for admin with org id query params', async () => {
      const response = await supertest(app)
        .get(`${url}?organizationId=${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(2);
    });

    test('Should fetch if all users in org for org admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(2);
    });

    test('Should not fetch users if not admin or not regular user', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('POST: /', () => {
    test('Should create a new user if admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'random@mail.com',
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('random@mail.com');
      expect(response.body.user.role).toBe(Role.USER);
      expect(response.body.user.organizationId).toBeUndefined();
    });

    test('Should not create a user with existing email', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: USER_TEST_EMAILS.user,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(USER_EMAIL_EXISTS.STATUS);
      expect(response.body).toHaveProperty('error', USER_EMAIL_EXISTS.MESSAGE);
    });

    test('Should not create user if not admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: USER_TEST_EMAILS.user4,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should create user if org admin', async () => {
      const response = await supertest(app)
        .post(`${url}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: USER_TEST_EMAILS.user4,
          password: USER_TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          role: Role.ADMIN,
        });
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.organization).toHaveProperty('id', organization.id);
      expect(response.body.user.role).toBe(Role.USER); // Should default to USER
    });
  });

  describe('GET: /non-organization-users', () => {
    test('Should not fetch non-organization users without auth', async () => {
      const response = await supertest(app).get(`${url}/non-organization-users`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });
    test('Should fetch non-organization users with admin token', async () => {
      const response = await supertest(app)
        .get(`${url}/non-organization-users`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users).toHaveLength(3);
    });
    test('Should not fetch non-organization users if not admin', async () => {
      const response = await supertest(app)
        .get(`${url}/non-organization-users`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /bookmarked-modules', () => {
    test('Should not fetch bookmarked modules without auth', async () => {
      const response = await supertest(app).get(`${url}/bookmarked-modules`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });
    test('Should fetch bookmarked modules with auth', async () => {
      await supertest(app)
        .put(`${url}/bookmark-module`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          moduleId: module.id,
          bookmark: true,
        });

      const response = await supertest(app)
        .get(`${url}/bookmarked-modules`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.bookmarks).toBeInstanceOf(Array);
      expect(response.body.bookmarks[0]).toHaveProperty('module.id', module.id);
      expect(response.body.bookmarks[0]).toHaveProperty('module.title', module.title);
      expect(response.body.bookmarks[0]).toHaveProperty('module.lesson.id', lesson.id);
      expect(response.body.bookmarks[0]).toHaveProperty('module.lesson.course.id', course.id);
    });
  });

  describe('GET: /dashboard', () => {
    test('Should not fetch dashboard data without auth', async () => {
      const response = await supertest(app).get(`${url}/dashboard`);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body).toHaveProperty('error', UNAUTHORIZED.MESSAGE);
    });
    test('Should fetch correct data for user', async () => {
      const response = await supertest(app)
        .get(`${url}/dashboard`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.dashboardData).toHaveProperty('enrolledCoursesCount', 0);
    });
    test('Should fetch correct data for admin', async () => {
      const response = await supertest(app)
        .get(`${url}/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.dashboardData).toHaveProperty('usersCount', 6); // 4 + 2 created in POST tests
      expect(response.body.dashboardData).toHaveProperty('organizationsCount', 1);
      expect(response.body.dashboardData).toHaveProperty('coursesCount', 2);
    });
    test('Should fetch correct data for org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/dashboard`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.dashboardData).toHaveProperty('usersCount', 3); // 2 + 1 created in POST tests
      expect(response.body.dashboardData).toHaveProperty('coursesCount', 1);
    });
  });

  describe('GET: /:id', async () => {
    test('Should fetch user by ID with admin token', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user.id);
    });

    test('Should fetch user if org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user3.id);
    });

    test('Should fetch user if user himself', async () => {
      const response = await supertest(app)
        .get(`${url}/${user2.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', user2.id);
    });

    test('Should not fetch user by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_PARAMS.MESSAGE);
    });

    test('Should not fetch user if not admin or org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });

    test('Should not fetch user if user himself tries to access another user', async () => {
      const response = await supertest(app)
        .get(`${url}/${user2.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id/progress', () => {
    beforeAll(async () => {
      await supertest(app)
        .put(`${url}/enroll-course`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: course.id,
          enroll: true,
        });
    });

    test('Should fetch user progress by ID with admin token', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}/progress`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.progress[0]).toHaveProperty('completedModules');
      expect(response.body.progress[0]).toHaveProperty('completedQuizzes');
      expect(response.body.progress[0]).toHaveProperty('completedAssessments');
    });
    test('Should fetch user progress if org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user3.id}/progress`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.progress).toBeInstanceOf(Array);
    });
    test('Should fetch user progress if user himself', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}/progress`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.progress).toBeInstanceOf(Array);
    });
    test('Should not fetch user progress by invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id/progress`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_PARAMS.MESSAGE);
    });
    test('Should not fetch user progress if not admin or org admin or himself', async () => {
      const response = await supertest(app)
        .get(`${url}/${user.id}/progress`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });
    test('Should not fetch user if user not part of organization of org admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${user2.id}/progress`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update user name by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'Updated');
    });

    test('Should update user by org admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'OrgAdmin',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'OrgAdmin');
    });

    test('Should update user name by user himself', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'User',
          lastName: 'Updated',
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('firstName', 'User');
    });

    test('Should not update user if not admin or org admin himself', async () => {
      const response = await supertest(app)
        .put(`${url}/${user3.id}`) // belogs to another user
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          firstName: 'NotAllowed',
          lastName: 'User',
        });
      expect(response.status).toBe(USER_FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', USER_FORBIDDEN.MESSAGE);
    });

    test('Should not update user with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email', // Invalid email format
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not update user with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Invalid',
          lastName: 'User',
        });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id/organization', () => {
    test('Should not update user org with invalid org id', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: 'org_1234567890abcdef', // Example organization ID
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should not update user organization if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId: organization.id,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should update user organization by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user2.id}/organization`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: organization.id, // Valid organization ID
        });
      expect(response.status).toBe(200);
      expect(response.body.user.organization).toHaveProperty('id', organization.id);
    });
  });

  describe('PUT: /:id/role', () => {
    test('Should not update user role if not admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not update user role with invalid role', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE', // Invalid role
        });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body).toHaveProperty('error', INVALID_DATA.MESSAGE);
    });

    test('Should update user role by admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${user.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.ADMIN,
        });
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('role', Role.ADMIN);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should not delete user if not admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${user3Token}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body).toHaveProperty('error', FORBIDDEN.MESSAGE);
    });

    test('Should not delete user himself', async () => {
      const response = await supertest(app)
        .delete(`${url}/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(USER_OWN_ACCOUNT_DELETION.STATUS);
      expect(response.body).toHaveProperty('error', USER_OWN_ACCOUNT_DELETION.MESSAGE);
    });

    test('Should delete user if org admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user3.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(204);
    });

    test('Should delete user by admin', async () => {
      const response = await supertest(app)
        .delete(`${url}/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });
  });
});
