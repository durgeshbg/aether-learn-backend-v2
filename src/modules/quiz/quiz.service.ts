import { PrismaClient } from '../../generated/prisma';
import type { QuizCreateType, QuizUpdateType } from './quiz.schema';

const prisma = new PrismaClient();

export const QuizService = {
  async findAll(courseId: string, userId?: string, orgAdmin?: string | null, role?: string) {
    if (role === 'ADMIN') {
      return await prisma.quiz.findMany({
        where: { courseId },
        include: {
          course: true,
        },
      });
    }

    if (orgAdmin) {
      return await prisma.quiz.findMany({
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
                quizzes: true,
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.quizzes || [];
  },

  async findById(
    id: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string,
  ) {
    if (role === 'ADMIN') {
      return await prisma.quiz.findUnique({
        where: { id, courseId },
        include: {
          course: true,
        },
      });
    }

    if (orgAdmin) {
      return await prisma.quiz.findFirst({
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
                quizzes: true,
              },
            },
          },
        },
      },
    });
    return user?.organization?.courses[0]?.quizzes.find((quiz) => quiz.id === id) || null;
  },

  async create(courseId: string, quizData: QuizCreateType) {
    return await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        courseId,
      },
      include: {
        course: true,
      },
    });
  },

  async update(id: string, courseId: string, quizData: QuizUpdateType) {
    return await prisma.quiz.update({
      where: { id, courseId },
      data: {
        title: quizData.title,
        description: quizData.description,
      },
      include: {
        course: true,
      },
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.quiz.delete({
      where: { id, courseId },
    });
  },
};
