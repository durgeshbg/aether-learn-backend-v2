import { PrismaClient, Role } from '../../generated/prisma';
import type { CourseCreateType, CourseUpdateType } from './course.schema';

const prisma = new PrismaClient();

export const CourseService = {
  async findAll(
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
    organizationId?: string
  ) {
    if (role === Role.ADMIN) {
      return await prisma.course.findMany({
        ...(organizationId && {
          where: {
            organizations: {
              some: {
                id: organizationId,
              },
            },
          },
        }),
      });
    }

    if (orgAdmin) {
      return await prisma.course.findMany({
        where: {
          organizations: {
            some: {
              id: orgAdmin,
            },
          },
        },
      });
    }

    if (userId) {
      return await prisma.course.findMany({
        where: {
          organizations: {
            some: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      });
    }
  },

  async findById(
    id: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role
  ) {
    if (role === Role.ADMIN) {
      return await prisma.course.findUnique({
        where: { id },
      });
    }

    if (orgAdmin) {
      return await prisma.course.findUnique({
        where: { id, organizations: { some: { id: orgAdmin } } },
      });
    }

    if (userId) {
      return await prisma.course.findUnique({
        where: {
          id,
          organizations: {
            some: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      });
    }
  },

  async create(courseData: CourseCreateType) {
    return await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
      },
    });
  },

  async update(id: string, courseData: CourseUpdateType) {
    return await prisma.course.update({
      where: { id },
      data: {
        name: courseData.name,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
      },
      include: {
        lessons: true,
        quizzes: true,
        codeAssessments: true,
      },
    });
  },

  async delete(id: string) {
    return await prisma.course.delete({
      where: { id },
    });
  },
};
