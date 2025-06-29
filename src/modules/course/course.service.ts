import { PrismaClient } from '../../generated/prisma';
import type { CourseCreateType, CourseUpdateType } from './course.schema';

const prisma = new PrismaClient();

export const CourseService = {
  async findAll() {
    return await prisma.course.findMany({
      include: {
        lessons: true,
        quizzes: true,
        codeAssessments: true,
      },
    });
  },

  async findById(id: string) {
    return await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: true,
        quizzes: true,
        codeAssessments: true,
      },
    });
  },

  async create(courseData: CourseCreateType) {
    return await prisma.course.create({
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
