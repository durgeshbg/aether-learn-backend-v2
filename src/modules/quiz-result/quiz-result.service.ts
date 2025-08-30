import { PrismaClient } from '../../generated/prisma';
import { UserService } from '../user/user.service';

const prisma = new PrismaClient();

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
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        organization: {
          include: {
            courses: {
              where: { quizzes: { some: { id: quizId } } },
              include: {
                quizzes: {
                  include: {
                    quizResults: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.quizzes[0]?.quizResults || [];
  },

  create: async (quizId: string, userId: string, courseId: string, score: number = 0) => {
    const quizResult = await prisma.quizResult.create({
      data: {
        quizId,
        userId,
        score,
      },
      select: {
        id: true,
        score: true,
        user: true,
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    await prisma.enrolledCourseProgress.update({
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
    });

    await UserService.refreshUserStreak(userId);

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
      });
    }

    return await prisma.quizResult.findFirst({
      where: { id, userId, quiz: { id: quizId, courseId } },
    });
  },

  delete: async (id: string, quizId: string) => {
    return await prisma.quizResult.delete({
      where: { id, quizId },
    });
  },
};
