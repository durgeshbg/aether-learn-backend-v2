import { Router } from 'express';
import moduleRouter from './module.route';
const router = Router({ mergeParams: true });

router.use('/modules', moduleRouter);

export default router;
