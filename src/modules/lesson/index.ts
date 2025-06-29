import { Router } from 'express';
import lessonRouter from './lesson.route';
import moduleRouter from '../module';

const router = Router({ mergeParams: true });

router.use('/lessons', lessonRouter);
router.use('/lessons/:lessonId', moduleRouter);

export default router;
