import { Router } from 'express';
import quizRouter from './quiz.route';
import questionRouter from '../question';

const router = Router({ mergeParams: true });

router.use('/quizzes', quizRouter);
router.use('/quizzes/:quizId', questionRouter);

export default router;
