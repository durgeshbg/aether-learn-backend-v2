import organizationRouter from './organization.route';
import express from 'express';

const router = express.Router();

router.use('/organizations', organizationRouter);

export default router;
