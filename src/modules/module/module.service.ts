import { PrismaClient, Role } from '../../generated/prisma';
import type { ModuleCreateType, ModuleUpdateType } from './module.schema';

const prisma = new PrismaClient();

export const ModuleService = {
  findAll: async (
    lessonId: string,
    courseId: string,
    userId?: string,
    role?: Role,
    orgAdmin?: string | null
  ) => {
    if (role === Role.ADMIN) {
      return await prisma.module.findMany({ where: { lessonId } });
    }

    if (orgAdmin) {
      return await prisma.module.findMany({
        where: {
          lesson: {
            course: {
              organizations: {
                some: { id: orgAdmin },
              },
            },
          },
        },
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        organization: {
          include: {
            courses: {
              where: {
                id: courseId,
              },
              include: {
                lessons: {
                  where: {
                    id: lessonId,
                  },
                  include: {
                    modules: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.lessons[0]?.modules || [];
  },
  create: async (lessonId: string, moduleData: ModuleCreateType) => {
    return await prisma.module.create({
      data: { ...moduleData, lessonId },
    });
  },
  findById: async (
    id: string,
    lessonId: string,
    courseId: string,
    userId?: string,
    role?: Role,
    orgAdmin?: string | null
  ) => {
    if (role === Role.ADMIN) {
      return await prisma.module.findUnique({
        where: { id, lessonId },
      });
    }

    if (orgAdmin) {
      return await prisma.module.findFirst({
        where: {
          id,
          lesson: {
            course: {
              organizations: {
                some: { id: orgAdmin },
              },
            },
          },
        },
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        organization: {
          include: {
            courses: {
              where: { id: courseId },
              include: {
                lessons: {
                  where: { id: lessonId },
                  include: { modules: true },
                },
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.lessons[0]?.modules.find(
        (module) => module.id === id
      ) || null
    );
  },
  update: async (
    id: string,
    lessonId: string,
    moduleData: ModuleUpdateType
  ) => {
    return await prisma.module.update({
      where: { id, lessonId },
      data: moduleData,
    });
  },
  delete: async (id: string, lessonId: string) => {
    return await prisma.module.delete({
      where: { id, lessonId },
    });
  },
};
