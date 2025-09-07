import { Prisma, PrismaClient } from '../../generated/prisma';
import { questionSelect } from '../question/question.service';
import type { QuizCreateType, QuizUpdateType } from './quiz.schema';

const prisma = new PrismaClient();

export const quizSelect: Prisma.QuizSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
};

const quizSelectWithQuestion: Prisma.QuizSelect = {
  id: true,
  title: true,
  description: true,
  difficulty: true,
  durationMinutes: true,
  passPercentage: true,
  questions: {
    select: questionSelect,
  },
  createdAt: true,
  updatedAt: true,
};

export const QuizService = {
  async findAll(courseId: string, userId?: string, orgAdmin?: string | null, role?: string) {
    if (role === 'ADMIN') {
      return await prisma.quiz.findMany({
        where: { courseId },
        select: quizSelect,
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
        select: quizSelect,
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
                quizzes: { select: quizSelect },
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
        select: quizSelectWithQuestion,
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
        select: quizSelectWithQuestion,
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
                  select: quizSelectWithQuestion,
                },
              },
            },
          },
        },
      },
    });
    return user?.organization?.courses[0]?.quizzes.find((quiz) => quiz.id === id) || null;
  },

  async create(courseId: string, quizData: QuizCreateType) {
    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        courseId,
      },
      select: quizSelectWithQuestion,
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        quizzesCount: { increment: 1 },
      },
    });

    return quiz;
  },

  async update(id: string, courseId: string, quizData: QuizUpdateType) {
    return await prisma.quiz.update({
      where: { id, courseId },
      data: {
        ...quizData,
      },
      select: quizSelectWithQuestion,
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.quiz.delete({
      where: { id, courseId },
    });
  },
};
