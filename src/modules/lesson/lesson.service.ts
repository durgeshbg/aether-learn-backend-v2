import { PrismaClient } from '../../generated/prisma';
import type { LessonCreateType, LessonUpdateType } from './lesson.schema';

const prisma = new PrismaClient();

export const LessonService = {
  async findAll() {
    return await prisma.lesson.findMany({});
  },

  async findById(id: string) {
    return await prisma.lesson.findUnique({
      where: { id },
    });
  },

  async create(lessonData: LessonCreateType) {
    return await prisma.lesson.create({
      data: {
        title: lessonData.title,
        content: lessonData.content,
        courseId: lessonData.courseId,
      },
      include: {
        course: true,
      },
    });
  },

  async update(id: string, lessonData: LessonUpdateType) {
    return await prisma.lesson.update({
      where: { id },
      data: {
        title: lessonData.title,
        content: lessonData.content,
      },
      include: {
        course: true,
      },
    });
  },

  async delete(id: string) {
    return await prisma.lesson.delete({
      where: { id },
    });
  },
};
