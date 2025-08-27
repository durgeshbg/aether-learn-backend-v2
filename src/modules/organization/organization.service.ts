import type { CreateOrganizationType, OrganizationUpdateType } from './organization.schema';
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

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: { users: { connect: validUserIds } },
      select: {
        _count: {
          select: { users: true },
        },
      },
    });
    return await prisma.organization.update({
      where: { id },
      data: { usersCount: updatedOrganization._count.users },
      select: {
        id: true,
        name: true,
        users: {
          select: userSelect,
        },
        usersCount: true,
      },
    });
  },

  removeUsers: async (id: string, userIds: string[]) => {
    const existingUsers = await prisma.organization.findUnique({ where: { id } }).users();
    const existingUserIds = existingUsers?.map((user) => user.id) || [];
    const usersToRemove = existingUserIds.filter((uid) => userIds.includes(uid));

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        users: {
          disconnect: usersToRemove.map((uid) => ({ id: uid })),
        },
      },
      select: {
        _count: {
          select: { users: true },
        },
      },
    });

    return await prisma.organization.update({
      where: { id },
      data: { usersCount: updatedOrganization._count.users },
      select: {
        id: true,
        name: true,
        users: {
          select: userSelect,
        },
        usersCount: true,
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

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        courses: { connect: validCourseIds },
      },
      select: {
        _count: {
          select: { courses: true },
        },
      },
    });
    return await prisma.organization.update({
      where: { id },
      data: { coursesCount: updatedOrganization._count.courses },
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
        coursesCount: true,
      },
    });
  },

  removeCourses: async (id: string, courseIds: string[]) => {
    const existingCourses = await prisma.organization.findUnique({ where: { id } }).courses();
    const existingCourseIds = existingCourses?.map((course) => course.id) || [];
    const coursesToRemove = existingCourseIds.filter((cid) => courseIds.includes(cid));

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        courses: {
          disconnect: coursesToRemove.map((cid) => ({ id: cid })),
        },
      },
      select: {
        _count: {
          select: { courses: true },
        },
      },
    });
    return await prisma.organization.update({
      where: { id },
      data: { coursesCount: updatedOrganization._count.courses },
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
        coursesCount: true,
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
