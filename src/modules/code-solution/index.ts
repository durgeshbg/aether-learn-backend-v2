import { Router } from 'express';
import codeSolutionRouter from './code-solution.route';
import { validate, validateParams } from '../../middlewares/validate';
import { CodeSolutionController } from './code-solution.controller';
import {
  CodeSolutionIdAndTestCaseIdParamSchema,
  Judge0SubmissionSchema,
} from './code-solution.schema';
import { authMiddleware } from '../../middlewares/auth';

const router = Router({ mergeParams: true });

router.put(
  '/code-solutions/:codeSolutionId/test-cases/:testCaseId/judge0-submission/:judge0AuthToken',
  authMiddleware,
  validateParams(CodeSolutionIdAndTestCaseIdParamSchema),
  validate(Judge0SubmissionSchema),
  CodeSolutionController.updateJudge0Submission,
);

router.use('/code-solutions', codeSolutionRouter);

export default router;
