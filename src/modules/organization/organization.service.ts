import type {
  CreateOrganizationType,
  OrganizationUpdateType,
} from './organization.schema';
import { PrismaClient } from '../../generated/prisma';
import { userSelect } from '../user/user.service';

const prisma = new PrismaClient();

export const OrganizationService = {
  findAll: async () => {
    return await prisma.organization.findMany();
  },

  findById: async (id: string) => {
    return await prisma.organization.findUnique({
      where: { id },
      include: { users: true, courses: true },
    });
  },

  findByName: async (name: string) => {
    return await prisma.organization.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive', // Case insensitive search
        },
      },
    });
  },

  create: async (data: CreateOrganizationType) => {
    return await prisma.organization.create({ data });
  },

  update: async (id: string, data: OrganizationUpdateType) => {
    return await prisma.organization.update({ where: { id }, data });
  },

  updateOrgAdmin: async (id: string, userId: string) => {
    return await prisma.organization.update({
      where: { id },
      data: {
        orgAdminId: userId,
        users: {
          connect: { id: userId },
        },
      },
    });
  },

  delete: async (id: string) => {
    return await prisma.organization.delete({ where: { id } });
  },

  // Users
  addUsers: async (id: string, userIds: string[]) => {
    const validUserIds = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true },
    });

    return await prisma.organization.update({
      where: { id },
      data: { users: { connect: validUserIds } },
    });
  },

  removeUsers: async (id: string, userIds: string[]) => {
    const existingUsers = await prisma.organization
      .findUnique({ where: { id } })
      .users();
    const existingUserIds = existingUsers?.map((user) => user.id) || [];
    const usersToRemove = existingUserIds.filter((uid) =>
      userIds.includes(uid)
    );

    return await prisma.organization.update({
      where: { id },
      data: {
        users: {
          disconnect: usersToRemove.map((uid) => ({ id: uid })),
        },
      },
    });
  },

  findAllUsers: async (id: string) => {
    return await prisma.organization.findUnique({ where: { id } }).users({
      select: userSelect,
    });
  },

  // Courses
  addCourses: async (id: string, courseIds: string[]) => {
    const validCourseIds = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: { id: true },
    });

    return await prisma.organization.update({
      where: { id },
      data: { courses: { connect: validCourseIds } },
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  removeCourses: async (id: string, courseIds: string[]) => {
    const existingCourses = await prisma.organization
      .findUnique({ where: { id } })
      .courses();
    const existingCourseIds = existingCourses?.map((course) => course.id) || [];
    const coursesToRemove = existingCourseIds.filter((cid) =>
      courseIds.includes(cid)
    );

    return await prisma.organization.update({
      where: { id },
      data: {
        courses: {
          disconnect: coursesToRemove.map((cid) => ({ id: cid })),
        },
      },
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  findAllCourses: async (id: string) => {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnailUrl: true,
            createdAt: true,
            updatedAt: true,
            lessons: true,
            quizzes: true,
            codeAssessments: true,
          },
        },
      },
    });
    const courses = organization?.courses || [];
    return courses;
  },
};
