import { Router } from 'express';
import lessonRouter from './lesson.route';

const router = Router({ mergeParams: true });

router.use('/lessons', lessonRouter);

export default router;
