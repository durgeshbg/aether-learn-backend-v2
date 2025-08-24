import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth';
import {
  QuestionCreateSchema,
  QuestionUpdateSchema,
  QuestionIdParamsSchema,
  QuestionQuizCourseIdParamsSchema,
} from './question.schema';
import { QuestionController } from './question.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', validateParams(QuestionQuizCourseIdParamsSchema), QuestionController.findAll);

router.post(
  '/',
  adminMiddleware,
  validateParams(QuestionQuizCourseIdParamsSchema),
  validate(QuestionCreateSchema),
  QuestionController.create,
);

router.get('/:id', validateParams(QuestionIdParamsSchema), QuestionController.findById);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(QuestionIdParamsSchema),
  validate(QuestionUpdateSchema),
  QuestionController.update,
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(QuestionIdParamsSchema),
  QuestionController.delete,
);

export default router;
