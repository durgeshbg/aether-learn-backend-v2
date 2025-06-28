import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  CourseCreateSchema,
  CourseIdParamSchema,
  CourseUpdateSchema,
} from './course.schema';
import { CourseController } from './course.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router();

router.use(authMiddleware);

router.get('/', CourseController.findAll);

router.post(
  '/',
  adminMiddleware,
  validate(CourseCreateSchema),
  CourseController.create
);

router.get('/:id', validateParams(CourseIdParamSchema), CourseController.findById);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(CourseIdParamSchema),
  validate(CourseUpdateSchema),
  CourseController.update
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(CourseIdParamSchema),
  CourseController.delete
);

export default router;
