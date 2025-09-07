import { Prisma, PrismaClient, Role } from '../../generated/prisma';
import { moduleSelect } from '../module/module.service';
import type { LessonCreateType, LessonUpdateType } from './lesson.schema';

const prisma = new PrismaClient();

export const lessonSelect: Prisma.LessonSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
};

const lessonSelectWithContent: Prisma.LessonSelect = {
  id: true,
  title: true,
  difficulty: true,
  content: true,
  objectives: true,
  modules: {
    select: moduleSelect,
  },
  createdAt: true,
  updatedAt: true,
};

export const LessonService = {
  async findAll(courseId: string, userId?: string, orgAdmin?: string | null, role?: string) {
    if (role === 'ADMIN') {
      return await prisma.lesson.findMany({
        where: { courseId },
        select: {
          id: true,
          title: true,
          difficulty: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    if (orgAdmin) {
      return await prisma.lesson.findMany({
        where: {
          course: {
            organizations: {
              some: { id: orgAdmin },
            },
          },
        },
        select: lessonSelect,
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
                lessons: { select: lessonSelect },
              },
            },
          },
        },
      },
    });
    return user?.organization?.courses[0]?.lessons || [];
  },

  async findById(
    id: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
  ) {
    if (role === 'ADMIN') {
      return await prisma.lesson.findUnique({
        where: { id, courseId },
        select: lessonSelectWithContent,
      });
    }
    if (orgAdmin) {
      return await prisma.lesson.findFirst({
        where: {
          id,
          course: {
            organizations: {
              some: { id: orgAdmin },
            },
          },
        },
        select: lessonSelectWithContent,
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
                lessons: { select: lessonSelectWithContent },
              },
            },
          },
        },
      },
    });
    return user?.organization?.courses[0]?.lessons.find((lesson) => lesson.id === id) || null;
  },

  async create(courseId: string, lessonData: LessonCreateType) {
    const lesson = await prisma.lesson.create({
      data: {
        title: lessonData.title,
        content: lessonData.content,
        difficulty: lessonData.difficulty,
        objectives: lessonData.objectives,
        courseId,
      },
      select: lessonSelectWithContent,
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        lessonsCount: { increment: 1 },
      },
    });

    return lesson;
  },

  async update(id: string, courseId: string, lessonData: LessonUpdateType) {
    return await prisma.lesson.update({
      where: { id, courseId },
      data: {
        title: lessonData.title,
        content: lessonData.content,
        difficulty: lessonData.difficulty,
        objectives: lessonData.objectives,
      },
      select: lessonSelectWithContent,
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.lesson.delete({
      where: { id, courseId },
    });
  },
};
