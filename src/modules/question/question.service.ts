import { PrismaClient, Role } from '../../generated/prisma';
import type { QuestionCreateType, QuestionUpdateType } from './question.schema';

const prisma = new PrismaClient();

export const QuestionService = {
  findAll: async (
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role
  ) => {
    if (role === 'ADMIN') {
      return await prisma.question.findMany({
        where: {
          quiz: {
            id: quizId,
            courseId,
          },
        },
      });
    }

    if (orgAdmin) {
      return await prisma.question.findMany({
        where: {
          quiz: {
            id: quizId,
            course: {
              id: courseId,
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
                quizzes: {
                  where: { id: quizId },
                  include: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.quizzes[0]?.questions || [];
  },

  create: async (quizId: string, questionData: QuestionCreateType) => {
    return await prisma.question.create({
      data: { ...questionData, quizId },
    });
  },

  findById: async (
    id: string,
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role
  ) => {
    if (role === 'ADMIN') {
      return await prisma.question.findUnique({
        where: { id, quizId },
      });
    }

    if (orgAdmin) {
      return await prisma.question.findFirst({
        where: {
          id,
          quiz: {
            id: quizId,
            course: {
              id: courseId,
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
                quizzes: {
                  where: { id: quizId },
                  include: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.quizzes[0]?.questions.find(
        (question) => question.id === id
      ) || null
    );
  },

  update: async (
    id: string,
    quizId: string,
    questionData: QuestionUpdateType
  ) => {
    return await prisma.question.update({
      where: { id, quizId },
      data: questionData,
    });
  },

  delete: async (id: string, quizId: string) => {
    return await prisma.question.delete({
      where: { id, quizId },
    });
  },
};
