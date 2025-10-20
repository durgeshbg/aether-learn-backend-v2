import { Prisma, Role } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import type { ModuleCreateType, ModuleUpdateType } from './module.schema';

export const moduleSelect: Prisma.ModuleSelect = {
  id: true,
  title: true,
  durationMinutes: true,
  createdAt: true,
  updatedAt: true,
};

const moduleSelectWithContent: Prisma.ModuleSelect = {
  id: true,
  title: true,
  languageId: true,
  difficulty: true,
  content: true,
  objectives: true,
  code: true,
  durationMinutes: true,
  createdAt: true,
  updatedAt: true,
};

export const ModuleService = {
  findAll: async (
    lessonId: string,
    courseId: string,
    userId?: string,
    role?: Role,
    orgAdmin?: string | null,
  ) => {
    if (role === Role.ADMIN) {
      return await prisma.module.findMany({ where: { lessonId } });
    }

    if (orgAdmin) {
      return await prisma.module.findMany({
        where: {
          lesson: {
            id: lessonId,
            course: {
              id: courseId,
              organizations: {
                some: { id: orgAdmin },
              },
            },
          },
        },
        select: moduleSelect,
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
                    modules: { select: moduleSelect },
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
  create: async (courseId: string, lessonId: string, moduleData: ModuleCreateType) => {
    const module = prisma.module.create({
      data: { ...moduleData, lessonId },
      select: moduleSelectWithContent,
    });
    const courseUpdate = prisma.course.update({
      where: { id: courseId },
      data: { modulesCount: { increment: 1 } },
    });

    await prisma.$transaction([module, courseUpdate]);

    return module;
  },
  findById: async (
    id: string,
    lessonId: string,
    courseId: string,
    userId?: string,
    role?: Role,
    orgAdmin?: string | null,
  ) => {
    if (role === Role.ADMIN) {
      return await prisma.module.findUnique({
        where: { id, lessonId },
        select: moduleSelectWithContent,
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
        select: moduleSelectWithContent,
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
                  include: { modules: { select: moduleSelectWithContent } },
                },
              },
            },
          },
        },
        bookmarkedModules: true,
      },
    });

    const module =
      user?.organization?.courses[0]?.lessons[0]?.modules.find((module) => module.id === id) ||
      null;
    const isBookmarked = user?.bookmarkedModules.some((b) => b.moduleId === module?.id) || false;

    if (!module) return null;

    return { ...module, isBookmarked };
  },
  update: async (id: string, lessonId: string, moduleData: ModuleUpdateType) => {
    return await prisma.module.update({
      where: { id, lessonId },
      data: moduleData,
      select: moduleSelectWithContent,
    });
  },
  delete: async (id: string, lessonId: string) => {
    return await prisma.module.delete({
      where: { id, lessonId },
    });
  },
};
