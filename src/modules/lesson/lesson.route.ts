import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  LessonCourseIdParamsSchema,
  LessonCreateSchema,
  LessonIdParamsSchema,
  LessonUpdateSchema,
} from './lesson.schema';
import { LessonController } from './lesson.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  validateParams(LessonCourseIdParamsSchema),
  LessonController.findAll
);

router.post(
  '/',
  adminMiddleware,
  validateParams(LessonCourseIdParamsSchema),
  validate(LessonCreateSchema),
  LessonController.create
);

router.get(
  '/:id',
  validateParams(LessonIdParamsSchema),
  LessonController.findById
);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(LessonIdParamsSchema),
  validate(LessonUpdateSchema),
  LessonController.update
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(LessonIdParamsSchema),
  LessonController.delete
);

export default router;
