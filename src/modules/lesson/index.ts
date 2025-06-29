import { Router } from 'express';
import lessonRouter from './lesson.route';

const router = Router();

router.use('/lessons', lessonRouter);

export default router;
