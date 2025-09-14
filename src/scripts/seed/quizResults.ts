import type { DefaultArgs } from '@prisma/client/runtime/library';
import {
  Prisma,
  PrismaClient,
  type Question,
  type Quiz,
  type QuizResult,
  type User,
} from '../../generated/prisma';

export const seedQuizResults = async (
  prisma: PrismaClient,
  org1Users: User[],
  org2Users: User[],
  course1Quizzes: (Quiz & { questions: Question[] })[],
  course2Quizzes: (Quiz & { questions: Question[] })[],
  course3Quizzes: (Quiz & { questions: Question[] })[],
): Promise<QuizResult[]> => {
  // Clean up existing data
  await prisma.quizResult.deleteMany({});

  const quizResultsData: {
    userId: string;
    quizId: string;
    responses: string[];
    score: number;
    passed: boolean;
  }[] = [];

  const enrolledCourseProgressPromises: Prisma.Prisma__EnrolledCourseProgressClient<
    {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      courseId: string;
      userId: string;
      completionRate: number;
      nextModuleId: string | null;
    },
    never,
    DefaultArgs,
    Prisma.PrismaClientOptions
  >[] = [];

  org1Users.forEach((user) => {
    [...course1Quizzes, ...course3Quizzes].forEach((quiz) => {
      if (
        user.id === org1Users[0]!.id &&
        course3Quizzes.find((q) => q.courseId === quiz.courseId)
      ) {
        // Skip Org1 User1 for Course3 Quizzes
        return;
      }
      quizResultsData.push({
        userId: user.id,
        quizId: quiz.id,
        responses: quiz.questions.map((q) => `${q.id}:${q.answer}`),
        score: 100,
        passed: true,
      });
      quizResultsData.push({
        userId: user.id,
        quizId: quiz.id,
        responses: quiz.questions.map((q) => `${q.id}:2`), // Atleast one answer is 2
        score: 50,
        passed: false,
      });
      // Update EnrolledCourseProgress to connect completed quiz
      enrolledCourseProgressPromises.push(
        prisma.enrolledCourseProgress.update({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: quiz.courseId,
            },
          },
          data: {
            completedQuizzes: {
              connect: { id: quiz.id },
            },
          },
        }),
      );
    });
  });

  org2Users.forEach((user) => {
    course2Quizzes.forEach((quiz) => {
      if (
        user.id === org2Users[1]!.id &&
        course2Quizzes.find((q) => q.courseId === quiz.courseId)
      ) {
        // Skip Org2 User2 for Course2 Quizzes
        return;
      }
      quizResultsData.push({
        userId: user.id,
        quizId: quiz.id,
        responses: quiz.questions.map((q) => `${q.id}:${q.answer}`),
        score: 100,
        passed: true,
      });
      quizResultsData.push({
        userId: user.id,
        quizId: quiz.id,
        responses: quiz.questions.map((q) => `${q.id}:1`), // Atleast one answer is 1
        score: 50,
        passed: false,
      });
      // Update enrolled course progress to include completed quiz
      enrolledCourseProgressPromises.push(
        prisma.enrolledCourseProgress.update({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: quiz.courseId,
            },
          },
          data: {
            completedQuizzes: {
              connect: { id: quiz.id },
            },
          },
        }),
      );
    });
  });

  const quizResults = await Promise.all(
    quizResultsData.map((data) => prisma.quizResult.create({ data })),
  );

  await Promise.all(enrolledCourseProgressPromises);

  return quizResults;
};
