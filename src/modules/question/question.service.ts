import { PrismaClient } from '../../generated/prisma';
import type { QuestionCreateType, QuestionUpdateType } from './question.schema';

const prisma = new PrismaClient();

export const QuestionService = {
  findAll: async (quizId: string) => {
    return await prisma.question.findMany({ where: { quizId } });
  },

  create: async (quizId: string, questionData: QuestionCreateType) => {
    return await prisma.question.create({
      data: { ...questionData, quizId },
    });
  },

  findById: async (id: string, quizId: string) => {
    return await prisma.question.findUnique({
      where: { id, quizId },
    });
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
