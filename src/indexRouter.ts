import userRouter from './modules/user';
import organizationRouter from './modules/organization';
import { Router } from 'express';

const indexRouter = Router();

indexRouter.use(userRouter);
indexRouter.use(organizationRouter);

export default indexRouter;
