import { PrismaClient } from '../../generated/prisma';
import type { LessonCreateType, LessonUpdateType } from './lesson.schema';

const prisma = new PrismaClient();

export const LessonService = {
  async findAll(courseId: string) {
    return await prisma.lesson.findMany({ where: { courseId } });
  },

  async findById(id: string, courseId: string) {
    return await prisma.lesson.findUnique({
      where: { id, courseId },
    });
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
