import { PrismaClient } from '../../generated/prisma';
import type {
  CodeAssessmentCreateType,
  CodeAssessmentUpdateType,
} from './code-assessment.schema';

const prisma = new PrismaClient();

export const CodeAssessmentService = {
  async findAll(
    courseId: string,
    userId?: string,
    orgAdmin?: string | null,
    role?: string
  ) {
    if (role === 'ADMIN') {
      return await prisma.codeAssessment.findMany({
        where: { courseId },
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
                codeAssessments: true,
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
    role?: string
  ) {
    if (role === 'ADMIN') {
      return await prisma.codeAssessment.findFirst({
        where: { id, courseId },
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
                codeAssessments: true,
              },
            },
          },
        },
      },
    });

    return (
      user?.organization?.courses[0]?.codeAssessments.find(
        (assessment) => assessment.id === id
      ) || null
    );
  },

  async create(courseId: string, codeAssessmentData: CodeAssessmentCreateType) {
    return await prisma.codeAssessment.create({
      data: {
        title: codeAssessmentData.title,
        description: codeAssessmentData.description,
        instructions: codeAssessmentData.instructions,
        starterCode: codeAssessmentData.starterCode,
        languageId: codeAssessmentData.languageId,
        courseId,
      },
      include: {
        course: true,
      },
    });
  },

  async update(
    id: string,
    courseId: string,
    codeAssessmentData: CodeAssessmentUpdateType
  ) {
    return await prisma.codeAssessment.update({
      where: { id, courseId },
      data: {
        title: codeAssessmentData.title,
        description: codeAssessmentData.description,
        instructions: codeAssessmentData.instructions,
        starterCode: codeAssessmentData.starterCode,
        languageId: codeAssessmentData.languageId,
      },
      include: {
        course: true,
      },
    });
  },

  async delete(id: string, courseId: string) {
    return await prisma.codeAssessment.delete({
      where: { id, courseId },
    });
  },
};
