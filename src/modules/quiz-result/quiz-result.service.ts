import { Prisma } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import { userProgressSelect, UserService } from '../user/user.service';

const quizResultSelect: Prisma.QuizResultSelect = {
  id: true,
  quiz: {
    select: { id: true, title: true },
  },
  score: true,
  passed: true,
  createdAt: true,
};

const quizResultWithResponseSelect: Prisma.QuizResultSelect = {
  ...quizResultSelect,
  responses: true,
  // user: {
  //   select: {
  //     id: true,
  //     firstName: true,
  //     lastName: true,
  //     email: true,
  //   },
  // },
  // quiz: {
  //   select: {
  //     id: true,
  //     title: true,
  //   },
  // },
};

export const QuizResultService = {
  findAll: async (
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string,
  ) => {
    if (role === 'ADMIN') {
      return await prisma.quizResult.findMany({
        where: {
          quiz: {
            id: quizId,
            courseId,
          },
        },
        select: quizResultSelect,
      });
    }

    if (orgAdmin) {
      return await prisma.quizResult.findMany({
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
        select: quizResultSelect,
      });
    }

    const quizResults = await prisma.quizResult.findMany({
      where: { userId, quiz: { id: quizId, courseId } },
      select: quizResultSelect,
    });

    return quizResults;
  },

  create: async (
    quizId: string,
    userId: string,
    courseId: string,
    score: number = 0,
    responses: string[],
  ) => {
    const quizResult = await prisma.quizResult.create({
      data: {
        quizId,
        userId,
        score,
        responses,
      },
      select: quizResultSelect,
    });

    const updatedEnrollmentProgress = await prisma.enrolledCourseProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        completedQuizzes: {
          connect: { id: quizId },
        },
      },
      select: userProgressSelect,
    });

    await UserService.refreshUserStreak(userId);
    await UserService.updateCourseCompletionRate(updatedEnrollmentProgress, courseId);

    return quizResult;
  },

  findById: async (
    id: string,
    quizId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string,
  ) => {
    if (role === 'ADMIN') {
      return await prisma.quizResult.findUnique({
        where: { id, quizId },
        select: quizResultWithResponseSelect,
      });
    }

    if (orgAdmin) {
      return await prisma.quizResult.findFirst({
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
        select: quizResultWithResponseSelect,
      });
    }

    return await prisma.quizResult.findFirst({
      where: { id, userId, quiz: { id: quizId, courseId } },
      select: quizResultWithResponseSelect,
    });
  },

  delete: async (id: string, quizId: string) => {
    return await prisma.quizResult.delete({
      where: { id, quizId },
    });
  },
};
