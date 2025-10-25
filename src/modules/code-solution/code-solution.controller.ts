import type { Request, Response } from 'express';
import { CodeSolutionService } from './code-solution.service';
import { CodeSolutionErrors } from './code-solution.errors';
import type {
  CodeSolutionAssesmentIdParamType,
  CodeSolutionCreateType,
  CodeSolutionIdAndTestCaseIdParamType,
  CodeSolutionIdParamType,
  Judge0SubmissionType,
} from './code-solution.schema';
import {
  CodeSolutionStatus,
  CodeSolutionType,
  Role,
  TestCaseResultStatus,
} from '../../generated/prisma';
import QueueService from '../../queues/queues';
import {
  JobType,
  Queues,
  TEST_CASE_STATUS_MAP,
  type TestCaseExecutionJobData,
} from '../../enums/queue';
import { CodeAssessmentService } from '../code-assessment/code-assessment.service';
import { TestCaseResultService } from '../test-case-result/test-case-result.service';
import { prisma } from '../../lib/prisma';

const {
  CODE_SOLUTION_NOT_FOUND,
  CODE_SOLUTIONS_FETCH_FAILED,
  CODE_SOLUTION_FETCH_FAILED,
  CODE_SOLUTION_QUEUED,
  CODE_SOLUTION_SUBMISSION_FAILED,
} = CodeSolutionErrors;

export const CodeSolutionController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, codeAssessmentId } = req.params as CodeSolutionAssesmentIdParamType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const codeSolutions = await CodeSolutionService.findAll(
        codeAssessmentId,
        courseId,
        userId,
        orgAdmin,
        userRole,
      );
      res.status(200).json({ codeSolutions });
    } catch {
      res
        .status(CODE_SOLUTIONS_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTIONS_FETCH_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, codeAssessmentId, courseId } = req.params as CodeSolutionIdParamType;
    const userId = req.user?.id;
    const orgAdmin = req.user?.orgAdmin;
    const userRole = req.user?.role;
    try {
      const codeSolution = await CodeSolutionService.findById(
        id,
        codeAssessmentId,
        courseId,
        userId,
        orgAdmin,
        userRole,
      );
      if (!codeSolution) {
        res.status(CODE_SOLUTION_NOT_FOUND.STATUS).json({ error: CODE_SOLUTION_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ codeSolution });
    } catch {
      res
        .status(CODE_SOLUTION_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_FETCH_FAILED.MESSAGE });
    }
  },

  run: async (req: Request, res: Response) => {
    try {
      const { courseId, codeAssessmentId } = req.params as CodeSolutionAssesmentIdParamType;
      const userId = req?.user?.id;

      const codeSolution = await CodeSolutionController.queueTestCases(
        courseId,
        codeAssessmentId,
        CodeSolutionType.RUN,
        req.body,
        userId,
      );

      res
        .status(CODE_SOLUTION_QUEUED.STATUS)
        .json({ message: CODE_SOLUTION_QUEUED.MESSAGE, codeSolutionId: codeSolution.id });
    } catch {
      res
        .status(CODE_SOLUTION_SUBMISSION_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_SUBMISSION_FAILED.MESSAGE });
    }
  },

  submit: async (req: Request, res: Response) => {
    try {
      const { courseId, codeAssessmentId } = req.params as CodeSolutionAssesmentIdParamType;
      const userId = req?.user?.id;
      const codeSolution = await CodeSolutionController.queueTestCases(
        courseId,
        codeAssessmentId,
        CodeSolutionType.SUBMISSION,
        req.body,
        userId,
      );

      res
        .status(CODE_SOLUTION_QUEUED.STATUS)
        .json({ message: CODE_SOLUTION_QUEUED.MESSAGE, codeSolutionId: codeSolution.id });
    } catch {
      res
        .status(CODE_SOLUTION_SUBMISSION_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_SUBMISSION_FAILED.MESSAGE });
    }
  },

  queueTestCases: async (
    courseId: string,
    codeAssessmentId: string,
    type: CodeSolutionType,
    codeSolutionData: CodeSolutionCreateType,
    userId?: string,
  ) => {
    const queue = new QueueService().getQueue(Queues.CODE_EXECUTION);

    const codeAssessment = await CodeAssessmentService.findById(
      codeAssessmentId,
      courseId,
      undefined,
      undefined,
      Role.ADMIN,
    );

    if (!codeAssessment || !userId) {
      throw new Error(CODE_SOLUTION_SUBMISSION_FAILED.MESSAGE);
    }

    const codeSolution = await CodeSolutionService.create(
      codeSolutionData,
      type,
      codeAssessmentId,
      courseId,
      userId,
    );

    const sourceCode = codeSolutionData.code + '\n' + codeAssessment.runnerCode;

    await Promise.all(
      codeAssessment.testCases.map(async (testCase) => {
        const jobData: TestCaseExecutionJobData = {
          sourceCode,
          languageId: codeAssessment.languageId,
          stdin: testCase.input,
          expectedOutput: testCase.expected,
          courseId,
          codeAssessmentId,
          codeSolutionId: codeSolution.id,
          testCaseId: testCase.id,
        };

        queue?.add(JobType.TEST_CASE_EXECUTION, jobData);
      }),
    );

    return codeSolution;
  },

  updateJudge0Submission: async (req: Request, res: Response) => {
    const { codeSolutionId, testCaseId } = req.params as CodeSolutionIdAndTestCaseIdParamType;
    const judge0Submission: Judge0SubmissionType = req.body;

    const status =
      TEST_CASE_STATUS_MAP[judge0Submission.status.id] || TestCaseResultStatus.WRONG_ANSWER;
    const passed = status === TestCaseResultStatus.ACCEPTED && judge0Submission.stdout !== null;
    const time = judge0Submission.time ? parseInt(judge0Submission.time) : 0;

    const stdout = judge0Submission.stdout
      ? Buffer.from(judge0Submission.stdout, 'base64').toString('utf-8')
      : null;
    const stderr = judge0Submission.stderr
      ? Buffer.from(judge0Submission.stderr, 'base64').toString('utf-8')
      : null;

    try {
      const testCaseResult = await TestCaseResultService.create({
        passed,
        solutionId: codeSolutionId,
        testCaseId,
        stdout,
        time,
        memory: judge0Submission.memory,
        stderr,
        status,
        judge0Token: judge0Submission.token,
      });

      res.status(200).json({ testCaseResult });
    } catch {
      res
        .status(CODE_SOLUTION_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_FETCH_FAILED.MESSAGE });
    }
  },

  getStatus: async (req: Request, res: Response) => {
    const { id, codeAssessmentId, courseId } = req.params as CodeSolutionIdParamType;
    const userId = req.user?.id;
    const orgAdmin = req.user?.orgAdmin;
    const userRole = req.user?.role;

    try {
      const codeSolution = await CodeSolutionService.getStatus(
        id,
        codeAssessmentId,
        courseId,
        userId,
        orgAdmin,
        userRole,
      );

      if (!codeSolution) {
        res.status(CODE_SOLUTION_NOT_FOUND.STATUS).json({ error: CODE_SOLUTION_NOT_FOUND.MESSAGE });
        return;
      }

      if (codeSolution.status === CodeSolutionStatus.SUBMITTED) {
        const existingTestCaseResultsCount = await prisma.testCaseResult.count({
          where: {
            solutionId: id,
          },
        });

        const totalTestCases = await prisma.codeAssessment.findUnique({
          where: {
            id: codeAssessmentId,
          },
          select: {
            _count: {
              select: { testCases: true },
            },
          },
        });

        if (existingTestCaseResultsCount === totalTestCases?._count.testCases) {
          await CodeSolutionService.updateStatus(id, CodeSolutionStatus.GRADED);

          res.status(200).json({ status: CodeSolutionStatus.GRADED });

          return;
        }
      }

      res.status(200).json({ status: codeSolution?.status });
    } catch {
      res
        .status(CODE_SOLUTION_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_FETCH_FAILED.MESSAGE });
    }
  },
};
