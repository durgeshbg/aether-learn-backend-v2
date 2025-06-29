import userRouter from '../modules/user';
import organizationRouter from '../modules/organization';
import courseRouter from '../modules/course';
import lessonRouter from '../modules/lesson';
import { Router } from 'express';

const indexRouter = Router();

indexRouter.use(userRouter);
indexRouter.use(organizationRouter);
indexRouter.use(courseRouter);
indexRouter.use(lessonRouter);

export default indexRouter;
