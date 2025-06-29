import courseRouter from './course.route';
import lessonRouter from '../lesson';
import express from 'express';

const router = express.Router();

router.use('/courses', courseRouter);
router.use('/courses/:courseId', lessonRouter);

export default router;
