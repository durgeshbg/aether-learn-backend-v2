import { PrismaClient, Role } from '../../generated/prisma';
import type { LessonCreateType, LessonUpdateType } from './lesson.schema';

const prisma = new PrismaClient();

export const LessonService = {
  async findAll(
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string
  ) {
    if (role === 'ADMIN') {
      return await prisma.lesson.findMany({
        where: { courseId },
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
                lessons: true,
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
    role?: Role
  ) {
    if (role === 'ADMIN') {
      return await prisma.lesson.findUnique({
        where: { id, courseId },
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
                lessons: true,
              },
            },
          },
        },
      },
    });
    return (
      user?.organization?.courses[0]?.lessons.find(
        (lesson) => lesson.id === id
      ) || null
    );
  },

  async create(courseId: string, lessonData: LessonCreateType) {
    return await prisma.lesson.create({
      data: {
        title: lessonData.title,
        content: lessonData.content,
        courseId,
      },
      include: {
        course: true,
      },
    });
  },

  async update(id: string, courseId: string, lessonData: LessonUpdateType) {
    return await prisma.lesson.update({
      where: { id, courseId },
      data: {
        title: lessonData.title,
        content: lessonData.content,
      },
      include: {
        course: true,
      },
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.lesson.delete({
      where: { id, courseId },
    });
  },
};
