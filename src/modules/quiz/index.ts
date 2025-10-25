import { Router } from 'express';
import quizRouter from './quiz.route';
import questionRouter from '../question';
import quizResultRouter from '../quiz-result';

const router = Router({ mergeParams: true });

router.use('/quizzes/:quizId', questionRouter);
router.use('/quizzes/:quizId', quizResultRouter);
router.use('/quizzes', quizRouter);

export default router;
