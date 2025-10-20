import { Prisma } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';
import { testCaseSelect } from '../test-case/test-case.service';
import type { CodeAssessmentCreateType, CodeAssessmentUpdateType } from './code-assessment.schema';

export const codeAssessmentSelect: Prisma.CodeAssessmentSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
};

const codeAssessmentSelectWithTestCases: Prisma.CodeAssessmentSelect = {
  id: true,
  title: true,
  description: true,
  durationMinutes: true,
  instructions: true,
  languageId: true,
  starterCode: true,
  courseId: true,
  testCases: {
    select: testCaseSelect,
  },
  difficulty: true,
  createdAt: true,
  updatedAt: true,
};

export const CodeAssessmentService = {
  async findAll(courseId: string, userId?: string, orgAdmin?: string | null, role?: string) {
    if (role === 'ADMIN') {
      return await prisma.codeAssessment.findMany({
        where: { courseId },
        select: codeAssessmentSelect,
      });
    }

    if (orgAdmin) {
      return await prisma.codeAssessment.findMany({
        where: {
          course: {
            organizations: {
              some: { id: orgAdmin },
            },
          },
        },
        select: codeAssessmentSelect,
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
                codeAssessments: { select: codeAssessmentSelect },
              },
            },
          },
        },
      },
    });

    return user?.organization?.courses[0]?.codeAssessments || [];
  },

  async findById(
    id: string,
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string,
  ) {
    if (role === 'ADMIN') {
      return await prisma.codeAssessment.findFirst({
        where: { id, courseId },
        select: codeAssessmentSelectWithTestCases,
      });
    }

    if (orgAdmin) {
      return await prisma.codeAssessment.findFirst({
        where: {
          id,
          course: {
            organizations: {
              some: { id: orgAdmin },
            },
          },
        },
        select: codeAssessmentSelectWithTestCases,
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
                  select: codeAssessmentSelectWithTestCases,
                },
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.codeAssessments.find((assessment) => assessment.id === id) ||
      null
    );
  },

  async create(courseId: string, codeAssessmentData: CodeAssessmentCreateType) {
    const codeAssessment = await prisma.codeAssessment.create({
      data: {
        ...codeAssessmentData,
        courseId,
      },
      select: codeAssessmentSelectWithTestCases,
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        codeAssessmentsCount: {
          increment: 1,
        },
      },
    });

    return codeAssessment;
  },

  async update(id: string, courseId: string, codeAssessmentData: CodeAssessmentUpdateType) {
    return await prisma.codeAssessment.update({
      where: { id, courseId },
      data: {
        ...codeAssessmentData,
      },
      select: codeAssessmentSelectWithTestCases,
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.codeAssessment.delete({
      where: { id, courseId },
    });
  },
};
