import { Router } from 'express';
import codeSolutionRouter from './code-solution.route';

const router = Router({ mergeParams: true });

router.use('/code-solutions', codeSolutionRouter);

export default router;
