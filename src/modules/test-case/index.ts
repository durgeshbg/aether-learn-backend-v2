import { Router } from 'express';
import testCaseRouter from './test-case.route';

const router = Router({ mergeParams: true });

router.use('/test-cases', testCaseRouter);

export default router;
