import { PrismaClient } from '../../generated/prisma';
import type {
  TestCaseCreateType,
  TestCaseUpdateType,
} from './test-case.schema';

const prisma = new PrismaClient();

export const TestCaseService = {
  async findAll(codeAssessmentId: string) {
    return await prisma.testCase.findMany({
      where: { assessmentId: codeAssessmentId },
    });
  },

  async findById(id: string, codeAssessmentId: string) {
    return await prisma.testCase.findUnique({
      where: { id, assessmentId: codeAssessmentId },
    });
  },

  async create(codeAssessmentId: string, testCaseData: TestCaseCreateType) {
    return await prisma.testCase.create({
      data: {
        ...testCaseData,
        assessmentId: codeAssessmentId,
      },
    });
  },

  async update(
    id: string,
    codeAssessmentId: string,
    testCaseData: TestCaseUpdateType
  ) {
    return await prisma.testCase.update({
      where: { id, assessmentId: codeAssessmentId },
      data: testCaseData,
    });
  },

  async delete(id: string, codeAssessmentId: string) {
    return await prisma.testCase.delete({
      where: { id, assessmentId: codeAssessmentId },
    });
  },
};
