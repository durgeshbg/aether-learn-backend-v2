import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const QuizResultService = {
  findAll: async () => {
    return await prisma.quizResult.findMany();
  },

  create: async (quizId: string, userId: string, score: number = 0) => {
    return await prisma.quizResult.create({
      data: {
        quizId,
        userId,
        score,
      },
    });
  },

  findById: async (id: string, quizId: string) => {
    return await prisma.quizResult.findFirst({
      where: { id, quizId },
    });
  },

  delete: async (id: string, quizId: string) => {
    return await prisma.quizResult.delete({
      where: { id, quizId },
    });
  },
};
