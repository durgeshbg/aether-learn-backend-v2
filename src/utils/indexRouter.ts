import userRouter from '../modules/user';
import organizationRouter from '../modules/organization';
import CourseRouter from '../modules/course';
import { Router } from 'express';

const indexRouter = Router();

indexRouter.use(userRouter);
indexRouter.use(organizationRouter);
indexRouter.use(CourseRouter);

export default indexRouter;
