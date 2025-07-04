import { Router } from 'express';
import { validate, validateParams } from '../../middlewares/validate';
import { QuizController } from './quiz.controller.ts';
import {
  QuizCreateSchema,
  QuizIdParamsSchema,
  QuizUpdateSchema,
  QuizCourseIdParamsSchema,
} from './quiz.schema';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  validateParams(QuizCourseIdParamsSchema),
  QuizController.findAll
);

router.post(
  '/',
  adminMiddleware,
  validateParams(QuizCourseIdParamsSchema),
  validate(QuizCreateSchema),
  QuizController.create
);

router.get('/:id', validateParams(QuizIdParamsSchema), QuizController.findById);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(QuizIdParamsSchema),
  validate(QuizUpdateSchema),
  QuizController.update
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(QuizIdParamsSchema),
  QuizController.delete
);

export default router;
