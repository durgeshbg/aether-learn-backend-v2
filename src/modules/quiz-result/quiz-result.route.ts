import { Router } from 'express';
import { QuizResultController } from './quiz-result.controller';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth';
import {
  QuizResultCreateSchema,
  QuizResultIdParamsSchema,
  QuizResultQuizIdParamsSchema,
} from './quiz-result.schema';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', QuizResultController.findAll);

router.post(
  '/',
  validateParams(QuizResultQuizIdParamsSchema),
  validate(QuizResultCreateSchema),
  QuizResultController.create
);

router.get(
  '/:id',
  validateParams(QuizResultIdParamsSchema),
  QuizResultController.findById
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(QuizResultIdParamsSchema),
  QuizResultController.delete
);

export default router;
