import courseRouter from './course.route';
import lessonRouter from '../lesson';
import quizRouter from '../quiz';
import express from 'express';

const router = express.Router();

router.use('/courses', courseRouter);
router.use('/courses/:courseId', lessonRouter);
router.use('/courses/:courseId', quizRouter);

export default router;
