import type { $Enums } from '../../generated/prisma';

export type TestCaseResultCreateType = {
  passed: boolean;
  solutionId: string;
  testCaseId: string;
  stdout: string | null;
  time: number;
  memory: number | null;
  stderr: string | null;
  status: $Enums.TestCaseResultStatus | undefined;
  judge0Token: string;
};
