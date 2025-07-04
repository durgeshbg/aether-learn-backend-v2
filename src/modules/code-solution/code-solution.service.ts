import { PrismaClient } from '../../generated/prisma';
import { userSelect } from '../user/user.service';
import type {
  CodeSolutionCreateType,
  CodeSolutionScoreUpdateType,
  CodeSolutionStatusUpdateType,
} from './code-solution.schema';

const prisma = new PrismaClient();

export const CodeSolutionService = {
  findAll: async (codeAssessmentId: string) => {
    return await prisma.codeSolution.findMany({
      where: { assessmentId: codeAssessmentId },
      include: {
        user: {
          select: userSelect,
        },
        assessment: true,
      },
    });
  },

  findById: async (id: string, codeAssessmentId: string) => {
    return await prisma.codeSolution.findUnique({
      where: { id, assessmentId: codeAssessmentId },
      include: {
        user: {
          select: userSelect,
        },
        assessment: true,
      },
    });
  },

  findByUser: async (codeAssessmentId: string, userId: string) => {
    return await prisma.codeSolution.findMany({
      where: { assessmentId: codeAssessmentId, userId },
      include: {
        user: {
          select: userSelect,
        },
        assessment: true,
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
