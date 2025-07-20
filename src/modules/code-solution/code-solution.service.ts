import { PrismaClient } from '../../generated/prisma';
import { userSelect } from '../user/user.service';
import type {
  CodeSolutionCreateType,
  CodeSolutionScoreUpdateType,
  CodeSolutionStatusUpdateType,
} from './code-solution.schema';

const prisma = new PrismaClient();

export const CodeSolutionService = {
  findAll: async (
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string
  ) => {
    if (role === 'ADMIN') {
      return await prisma.codeSolution.findMany({
        where: {
          assessment: {
            id: codeAssessmentId,
            courseId,
          },
        },
      });
    }

    if (orgAdmin) {
      return await prisma.codeSolution.findMany({
        where: {
          assessment: {
            id: codeAssessmentId,
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
              where: { codeAssessments: { some: { id: codeAssessmentId } } },
              include: {
                codeAssessments: {
                  include: {
                    codeSolutions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.codeAssessments[0]?.codeSolutions || []
    );
  },

  findById: async (
    id: string,
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string
  ) => {
    if (role === 'ADMIN') {
      return await prisma.codeSolution.findUnique({
        where: {
          id,
          assessment: {
            id: codeAssessmentId,
            courseId,
          },
        },
      });
    }

    if (orgAdmin) {
      return await prisma.codeSolution.findUnique({
        where: {
          id,
          assessment: {
            id: codeAssessmentId,
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

    return await prisma.codeSolution.findFirst({
      where: {
        id,
        userId,
        assessment: {
          id: codeAssessmentId,
          courseId,
        },
      },
    });
  },

  create: async (
    data: CodeSolutionCreateType,
    codeAssessmentId: string,
    userId: string
  ) => {
    return await prisma.codeSolution.create({
      data: {
        code: data.code,
        assessmentId: codeAssessmentId,
        userId,
      },
    });
  },

  updateStatus: async (
    codeSolutionId: string,
    codeAssessmentId: string,
    statusData: CodeSolutionStatusUpdateType
  ) => {
    return await prisma.codeSolution.update({
      where: { id: codeSolutionId, assessmentId: codeAssessmentId },
      data: statusData,
    });
  },

  updateScore: async (
    codeSolutionId: string,
    codeAssessmentId: string,
    scoreData: CodeSolutionScoreUpdateType
  ) => {
    return await prisma.codeSolution.update({
      where: { id: codeSolutionId, assessmentId: codeAssessmentId },
      data: {
        score: scoreData.score,
      },
    });
  },
};
