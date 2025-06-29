import { Router } from 'express';
import quizRouter from './quiz.route';

const router = Router({ mergeParams: true });

router.use('/quizzes', quizRouter);

export default router;
