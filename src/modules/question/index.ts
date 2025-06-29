import { Router } from 'express';
import questionRouter from './question.route';

const router = Router({ mergeParams: true });

router.use('/questions', questionRouter);

export default router;
