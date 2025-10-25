import { prisma } from '../../lib/prisma';
import type { TestCaseResultCreateType } from './test-case-result.schema';

export const TestCaseResultService = {
  create: async (data: TestCaseResultCreateType) => {
    const testCaseResult = await prisma.testCaseResult.create({
      data: {
        passed: data.passed,
        solutionId: data.solutionId,
        testCaseId: data.testCaseId,
        stdout: data.stdout,
        time: data.time,
        memory: data.memory,
        stderr: data.stderr,
        status: data.status,
        judge0Token: data.judge0Token,
      },
    });
    return testCaseResult;
  },
};
