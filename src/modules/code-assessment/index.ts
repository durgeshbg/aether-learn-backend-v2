import { Router } from 'express';
import codeAssessmentRouter from './code-assessment.route';
import testCaseRouter from '../test-case';

const router = Router({ mergeParams: true });

router.use('/code-assessments', codeAssessmentRouter);
router.use('/code-assessments/:codeAssessmentId', testCaseRouter);

export default router;
