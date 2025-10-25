import { Router } from 'express';
import codeAssessmentRouter from './code-assessment.route';
import codeSolutionRouter from '../code-solution';
import testCaseRouter from '../test-case';

const router = Router({ mergeParams: true });

router.use('/code-assessments/:codeAssessmentId', testCaseRouter);
router.use('/code-assessments/:codeAssessmentId', codeSolutionRouter);
router.use('/code-assessments', codeAssessmentRouter);

export default router;
