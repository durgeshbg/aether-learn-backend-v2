import { Prisma, Role } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import type { TestCaseCreateType, TestCaseUpdateType } from './test-case.schema';

export const testCaseSelect: Prisma.TestCaseSelect = {
  id: true,
  input: true,
  expected: true,
  weight: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

export const TestCaseService = {
  async findAll(
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: Role,
  ) {
    if (role === 'ADMIN') {
      return await prisma.testCase.findMany({
        where: {
          assessment: {
            id: codeAssessmentId,
            courseId,
          },
        },
        select: testCaseSelect,
      });
    }

    if (orgAdmin) {
      return await prisma.testCase.findMany({
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
        select: testCaseSelect,
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
                codeAssessments: {
                  where: { id: codeAssessmentId },
                  include: {
                    testCases: { select: testCaseSelect },
                  },
                },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.codeAssessments[0]?.testCases || [];
  },

  async findById(
    id: string,
    codeAssessmentId: string,
    courseId: string,
    userId?: string,
    userOrgAdmin?: string | null,
    userRole?: Role,
  ) {
    if (userRole === 'ADMIN') {
      return await prisma.testCase.findUnique({
        where: { id, assessmentId: codeAssessmentId },
        select: testCaseSelect,
      });
    }

    if (userOrgAdmin) {
      return await prisma.testCase.findFirst({
        where: {
          id,
          assessment: {
            id: codeAssessmentId,
            course: {
              id: courseId,
              organizations: {
                some: { id: userOrgAdmin },
              },
            },
          },
        },
        select: testCaseSelect,
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
                codeAssessments: {
                  where: { id: codeAssessmentId },
                  include: {
                    testCases: {
                      select: testCaseSelect,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.codeAssessments[0]?.testCases.find(
        (testCase) => testCase.id === id,
      ) || null
    );
  },

  async create(codeAssessmentId: string, testCaseData: TestCaseCreateType) {
    return await prisma.testCase.create({
      data: {
        ...testCaseData,
        assessmentId: codeAssessmentId,
      },
      select: testCaseSelect,
    });
  },

  async update(id: string, codeAssessmentId: string, testCaseData: TestCaseUpdateType) {
    return await prisma.testCase.update({
      where: { id, assessmentId: codeAssessmentId },
      data: testCaseData,
      select: testCaseSelect,
    });
  },

  async delete(id: string, codeAssessmentId: string) {
    return await prisma.testCase.delete({
      where: { id, assessmentId: codeAssessmentId },
    });
  },
};
