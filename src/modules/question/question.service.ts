import { Prisma, Role } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import type { QuestionCreateType, QuestionUpdateType } from './question.schema';

export const questionSelect: Prisma.QuestionSelect = {
  id: true,
  text: true,
  options: true,
  createdAt: true,
  updatedAt: true,
};

const questionSelectWithAnswer: Prisma.QuestionSelect = {
  id: true,
  text: true,
  options: true,
  answer: true,
  explanation: true,
  createdAt: true,
  updatedAt: true,
};

export const QuestionService = {
  findAll: async (
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
  ) => {
    if (role === 'ADMIN') {
      return await prisma.question.findMany({
        where: {
          quiz: {
            id: quizId,
            courseId,
          },
        },
        select: questionSelectWithAnswer,
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
        select: questionSelect,
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
                    questions: { select: questionSelect },
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
      select: questionSelect,
    });
  },

  findById: async (
    id: string,
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
  ) => {
    if (role === 'ADMIN') {
      return await prisma.question.findUnique({
        where: { id, quizId },
        select: questionSelectWithAnswer,
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
        select: questionSelect,
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
                    questions: { select: questionSelect },
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
        (question) => question.id === id,
      ) || null
    );
  },

  update: async (id: string, quizId: string, questionData: QuestionUpdateType) => {
    return await prisma.question.update({
      where: { id, quizId },
      data: questionData,
      select: questionSelectWithAnswer,
    });
  },

  delete: async (id: string, quizId: string) => {
    return await prisma.question.delete({
      where: { id, quizId },
    });
  },
};
