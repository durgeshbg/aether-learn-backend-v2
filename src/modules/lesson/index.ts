import { Router } from 'express';
import lessonRouter from './lesson.route';
import moduleRouter from '../module';

const router = Router({ mergeParams: true });

router.use('/lessons/:lessonId', moduleRouter);
router.use('/lessons', lessonRouter);

export default router;
