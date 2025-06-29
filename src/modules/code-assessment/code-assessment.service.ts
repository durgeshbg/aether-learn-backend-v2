import { PrismaClient } from '../../generated/prisma';
import type { CodeAssessmentCreateType, CodeAssessmentUpdateType } from './code-assessment.schema';

const prisma = new PrismaClient();

export const CodeAssessmentService = {
  async findAll(courseId: string) {
    return await prisma.codeAssessment.findMany({ where: { courseId } });
  },

  async findById(id: string, courseId: string) {
    return await prisma.codeAssessment.findUnique({
      where: { id, courseId },
    });
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

  async update(id: string, courseId: string, codeAssessmentData: CodeAssessmentUpdateType) {
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
