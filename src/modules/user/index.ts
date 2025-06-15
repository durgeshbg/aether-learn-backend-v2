import userRouter from './user.route';
import { Router } from 'express';

const userModuleRouter = Router();

userModuleRouter.use('/users', userRouter);

export default userModuleRouter;
