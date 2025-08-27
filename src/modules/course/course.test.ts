import { setupTests, staticData, type UserOrgAdmin } from '../../utils/test-utils';
import { describe, test, beforeAll, afterAll, expect } from 'bun:test';
import setupApp from '../../utils/setupApp';
import supertest from 'supertest';
import type { Application } from 'express';
import { PrismaClient, type Course, type Organization } from '../../generated/prisma';
import { ValidationErrors } from '../../middlewares/validate';
import { AuthErrors } from '../../middlewares/auth';
import { Role } from '../../generated/prisma';
import { CourseErrors } from './course.errors';

const url = '/api/v1/courses';

const { FORBIDDEN, UNAUTHORIZED } = AuthErrors;
const { INVALID_DATA, INVALID_PARAMS, INVALID_QUERY } = ValidationErrors;
const { COURSE_NOT_FOUND } = CourseErrors;
const { USER_TEST_EMAILS, USER_TEST_PASSWORD, ORGANIZATION_TEST_NAME, COURSE_TEST_NAME } =
  staticData;

describe('Course', async () => {
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
    test('Should not fetch courses without auth', async () => {
      const response = await supertest(app).get(url);
      expect(response.status).toBe(UNAUTHORIZED.STATUS);
      expect(response.body.error).toBe(UNAUTHORIZED.MESSAGE);
    });

    test('Should fetch all courses for admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.courses).toBeInstanceOf(Array);
      expect(response.body.courses.length).toEqual(1);
    });

    test('Should fetch all courses for admin with org id query param', async () => {
      const response = await supertest(app)
        .get(`${url}?organizationId=${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.courses).toBeInstanceOf(Array);
      expect(response.body.courses.length).toEqual(1);
    });

    test('Should fetch all courses for organization admin', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.courses).toBeInstanceOf(Array);
      expect(response.body.courses.length).toEqual(1);
    });

    test('Should not be visible for regular user not part of organization', async () => {
      const response = await supertest(app).get(url).set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.courses).toBeInstanceOf(Array);
      expect(response.body.courses.length).toBe(0);
    });
  });

  describe('POST: /', () => {
    test('Should create a new course as admin', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Course', description: 'desc' });
      expect(response.status).toBe(201);
      expect(response.body.course).toHaveProperty('id');
    });

    test('Should not create course as user', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Course', description: 'desc' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not create course with invalid data', async () => {
      const response = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', description: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });
  });

  describe('GET: /non-organization-courses', () => {
    test('Should fetch non-organization courses as admin', async () => {
      const response = await supertest(app)
        .get(`${url}/non-organization-courses?organizationId=${organization.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.courses).toBeInstanceOf(Array);
      expect(response.body.courses.length).toBeGreaterThan(0);
    });

    test('Should not fetch non-organization courses when non organization ID is provided', async () => {
      const response = await supertest(app)
        .get(`${url}/non-organization-courses?organizationId=invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_QUERY.STATUS);
      expect(response.body.error).toBe(INVALID_QUERY.MESSAGE);
    });

    test('Should not fetch non-organization courses as non admin', async () => {
      const response = await supertest(app)
        .get(`${url}/non-organization-courses?organizationId=${organization.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });
  });

  describe('GET: /:id', () => {
    test('Should fetch course by ID by admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.course).toHaveProperty('id', course.id);
      expect(response.body.course).toHaveProperty('name');
    });

    test('Should fetch course by ID by organization admin', async () => {
      const response = await supertest(app)
        .get(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.course).toHaveProperty('id', course.id);
      expect(response.body.course).toHaveProperty('name');
    });

    test('Should fech course by ID for regular user part of organization', async () => {
      // user2 to organization
      await supertest(app)
        .put(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });

      const response = await supertest(app)
        .get(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(200);
      expect(response.body.course).toHaveProperty('id', course.id);
      expect(response.body.course).toHaveProperty('name');

      // remove user2 from organization
      await supertest(app)
        .delete(`/api/v1/organizations/${organization.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [user2.id] });
    });

    test('Should not fetch course by ID for regular user not part of organization', async () => {
      const response = await supertest(app)
        .get(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(response.status).toBe(COURSE_NOT_FOUND.STATUS);
      expect(response.body.error).toBe(COURSE_NOT_FOUND.MESSAGE);
    });

    test('Should not fetch course with invalid ID', async () => {
      const response = await supertest(app)
        .get(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });
  });

  describe('PUT: /:id', () => {
    test('Should update course as admin', async () => {
      const response = await supertest(app)
        .put(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Course', description: 'Updated desc' });
      expect(response.status).toBe(200);
      expect(response.body.course.name).toBe('Updated Course');
    });

    test('Should not update course as user', async () => {
      const response = await supertest(app)
        .put(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Should Not Update', description: 'desc' });
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not update course with invalid data', async () => {
      const response = await supertest(app)
        .put(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', description: '' });
      expect(response.status).toBe(INVALID_DATA.STATUS);
      expect(response.body.error).toBe(INVALID_DATA.MESSAGE);
    });

    test('Should not update course with invalid ID', async () => {
      const response = await supertest(app)
        .put(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Course', description: 'desc' });
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });
  });

  describe('DELETE: /:id', () => {
    test('Should delete course as admin', async () => {
      // Create a course to delete
      const create = await supertest(app)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete', description: 'desc' });
      const delId = create.body.course.id;

      const response = await supertest(app)
        .delete(`${url}/${delId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
    });

    test('Should not delete course as user', async () => {
      const response = await supertest(app)
        .delete(`${url}/${course.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(FORBIDDEN.STATUS);
      expect(response.body.error).toBe(FORBIDDEN.MESSAGE);
    });

    test('Should not delete course with invalid ID', async () => {
      const response = await supertest(app)
        .delete(`${url}/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(INVALID_PARAMS.STATUS);
      expect(response.body.error).toBe(INVALID_PARAMS.MESSAGE);
    });
  });
});
