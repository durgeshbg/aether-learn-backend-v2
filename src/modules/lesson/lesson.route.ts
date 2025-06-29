import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  LessonCreateSchema,
  LessonIdParamsSchema,
  LessonUpdateSchema,
} from './lesson.schema';
import { LessonController } from './lesson.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', LessonController.findAll);

router.post('/', validate(LessonCreateSchema), LessonController.create);

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
