import { Router } from 'express';
import codeAssessmentRouter from './code-assessment.route';

const router = Router({ mergeParams: true });

router.use('/code-assessments', codeAssessmentRouter);

export default router;
