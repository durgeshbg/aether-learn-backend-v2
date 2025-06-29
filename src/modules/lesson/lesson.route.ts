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

router.use(authMiddleware, adminMiddleware);

router.get(
  '/',
  validateParams(LessonCourseIdParamsSchema),
  LessonController.findAll
);

router.post(
  '/',
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
  validateParams(LessonIdParamsSchema),
  validate(LessonUpdateSchema),
  LessonController.update
);

router.delete(
  '/:id',
  validateParams(LessonIdParamsSchema),
  LessonController.delete
);

export default router;
