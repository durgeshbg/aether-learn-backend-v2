import { $Enums, TestCaseResultStatus } from '../generated/prisma';

export enum Queues {
  CODE_EXECUTION = 'code-execution-queue',
}

export enum JobType {
  TEST_CASE_EXECUTION = 'test-case-execution',
}

export type TestCaseExecutionJobData = {
  sourceCode: string;
  languageId: number;
  stdin: string | null;
  expectedOutput: string;
  courseId: string;
  codeAssessmentId: string;
  codeSolutionId: string;
  testCaseId: string;
};

export const TEST_CASE_STATUS_MAP: { [key: number]: $Enums.TestCaseResultStatus } = {
  1: TestCaseResultStatus.IN_QUEUE,
  2: TestCaseResultStatus.PROCESSING,
  3: TestCaseResultStatus.ACCEPTED,
  4: TestCaseResultStatus.WRONG_ANSWER,
  5: TestCaseResultStatus.TIME_LIMIT_EXCEEDED,
  6: TestCaseResultStatus.COMPILATION_ERROR,
  7: TestCaseResultStatus.RUNTIME_ERROR_SIGSEGV,
  8: TestCaseResultStatus.RUNTIME_ERROR_SIGXFSZ,
  9: TestCaseResultStatus.RUNTIME_ERROR_SIGFPE,
  10: TestCaseResultStatus.RUNTIME_ERROR_SIGABRT,
  11: TestCaseResultStatus.RUNTIME_ERROR_NZEC,
  12: TestCaseResultStatus.RUNTIME_ERROR_OTHER,
  13: TestCaseResultStatus.INTERNAL_ERROR,
  14: TestCaseResultStatus.EXEC_FORMAT_ERROR,
};
