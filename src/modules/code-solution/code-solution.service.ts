import { CodeSolutionStatus, CodeSolutionType, Prisma, Role } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import { testCaseSelect } from '../test-case/test-case.service';
import { userProgressSelect, UserService } from '../user/user.service';
import type { CodeSolutionCreateType } from './code-solution.schema';

const codeSolutionSelect: Prisma.CodeSolutionSelect = {
  id: true,
  code: true,
  status: true,
  type: true,
  assessment: {
    select: {
      id: true,
      title: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

const codeSolutionSelectWithTestResults: Prisma.CodeSolutionSelect = {
  ...codeSolutionSelect,
  testCaseResults: {
    select: {
      id: true,
      passed: true,
      testCase: {
        select: testCaseSelect,
      },
      stdout: true,
      stderr: true,
      time: true,
      memory: true,
      status: true,
    },
  },
};

const codeSolutionStatusSelect: Prisma.CodeSolutionSelect = {
  id: true,
  status: true,
};

export const CodeSolutionService = {
  findAll: async (
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
  ) => {
    if (role === 'ADMIN') {
      return await prisma.codeSolution.findMany({
        where: {
          assessment: {
            id: codeAssessmentId,
            courseId,
          },
        },
        select: codeSolutionSelect,
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
        select: codeSolutionSelect,
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
                    codeSolutions: {
                      select: codeSolutionSelect,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.codeAssessments[0]?.codeSolutions || [];
  },

  findById: async (
    id: string,
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
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
        select: codeSolutionSelectWithTestResults,
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
        select: codeSolutionSelectWithTestResults,
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
      select: codeSolutionSelectWithTestResults,
    });
  },

  create: async (
    data: CodeSolutionCreateType,
    type: CodeSolutionType,
    codeAssessmentId: string,
    courseId: string,
    userId: string,
  ) => {
    const codeSolution = await prisma.codeSolution.create({
      data: {
        code: data.code,
        status: CodeSolutionStatus.SUBMITTED,
        type,
        assessment: {
          connect: { id: codeAssessmentId },
        },
        user: {
          connect: { id: userId },
        },
      },
    });

    const updatedEnrollmentProgress = await prisma.enrolledCourseProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        completedAssessments: {
          connect: { id: codeAssessmentId },
        },
      },
      select: userProgressSelect,
    });

    await UserService.refreshUserStreak(userId);
    await UserService.updateCourseCompletionRate(updatedEnrollmentProgress, courseId);

    return codeSolution;
  },

  updateCodeSolution: async (
    id: string,
    data: Partial<CodeSolutionCreateType>,
    type: CodeSolutionType,
    userId: string,
  ) => {
    const codeSolution = await prisma.codeSolution.update({
      where: { id },
      data: {
        code: data.code,
        type,
      },
    });

    await UserService.refreshUserStreak(userId);

    return codeSolution;
  },

  updateStatus: async (id: string, status: CodeSolutionStatus) => {
    return await prisma.codeSolution.update({
      where: { id },
      data: { status },
    });
  },

  getStatus: async (
    id: string,
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
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
        select: codeSolutionStatusSelect,
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
        select: codeSolutionStatusSelect,
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
      select: codeSolutionStatusSelect,
    });
  },
};
