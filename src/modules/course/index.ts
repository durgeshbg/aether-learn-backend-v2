import courseRouter from './course.route';
import express from 'express';

const router = express.Router();

router.use('/courses', courseRouter);

export default router;
