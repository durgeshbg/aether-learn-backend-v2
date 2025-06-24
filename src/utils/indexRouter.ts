import userRouter from '../modules/user';
import { Router } from 'express';

const indexRouter = Router();

indexRouter.use(userRouter);

export default indexRouter;
