import quizResultRouter from './quiz-result.route';
import { Router } from 'express';

const router = Router({ mergeParams: true });

router.use('/quiz-results', quizResultRouter);

export default router;
