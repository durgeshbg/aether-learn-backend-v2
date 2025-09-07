import type { CreateOrganizationType, OrganizationUpdateType } from './organization.schema';
import { Prisma, PrismaClient, Role } from '../../generated/prisma';

const prisma = new PrismaClient();

export const organizationSelect: Prisma.OrganizationSelect = {
  id: true,
  name: true,
  email: true,
  description: true,
  address: true,
  logoUrl: true,
  phone: true,
  websiteUrl: true,
  orgAdmin: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  usersCount: true,
  coursesCount: true,
  createdAt: true,
  updatedAt: true,
};

const organizationUsersSelect: Prisma.UserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const organizationCoursesSelect: Prisma.CourseSelect = {
  id: true,
  name: true,
  description: true,
  thumbnailUrl: true,
  rating: true,
  codeAssessmentsCount: true,
  lessonsCount: true,
  quizzesCount: true,
  createdAt: true,
  updatedAt: true,
};

export const OrganizationService = {
  findAll: async () => {
    return await prisma.organization.findMany({ select: organizationSelect });
  },

  findById: async (id: string, role: Role, orgAdmin: string, userId: string) => {
    if (role === 'ADMIN' || orgAdmin === id) {
      return await prisma.organization.findUnique({
        where: { id },
        select: organizationSelect,
      });
    }
    return await prisma.organization.findUnique({
      where: {
        id,
        users: {
          some: { id: userId },
        },
      },
      select: organizationSelect,
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
      select: organizationSelect,
    });
  },

  create: async (data: CreateOrganizationType) => {
    return await prisma.organization.create({ data, select: organizationSelect });
  },

  update: async (id: string, data: OrganizationUpdateType) => {
    return await prisma.organization.update({ where: { id }, data, select: organizationSelect });
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
      select: organizationSelect,
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
      select: organizationSelect,
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
      select: organizationSelect,
    });
  },

  findAllUsers: async (id: string) => {
    return await prisma.organization.findUnique({ where: { id } }).users({
      select: organizationUsersSelect,
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
      select: organizationSelect,
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
      select: organizationSelect,
    });
  },

  findAllCourses: async (id: string) => {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        courses: {
          select: organizationCoursesSelect,
        },
      },
    });
    const courses = organization?.courses || [];
    return courses;
  },
};
