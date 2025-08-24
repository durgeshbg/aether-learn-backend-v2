import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth';
import {
  CodeAssessmentCourseIdParamsSchema,
  CodeAssessmentCreateSchema,
  CodeAssessmentIdParamsSchema,
  CodeAssessmentUpdateSchema,
} from './code-assessment.schema';
import { CodeAssessmentController } from './code-assessment.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  validateParams(CodeAssessmentCourseIdParamsSchema),
  CodeAssessmentController.findAll,
);

router.post(
  '/',
  adminMiddleware,
  validateParams(CodeAssessmentCourseIdParamsSchema),
  validate(CodeAssessmentCreateSchema),
  CodeAssessmentController.create,
);

router.get('/:id', validateParams(CodeAssessmentIdParamsSchema), CodeAssessmentController.findById);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(CodeAssessmentIdParamsSchema),
  validate(CodeAssessmentUpdateSchema),
  CodeAssessmentController.update,
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(CodeAssessmentIdParamsSchema),
  CodeAssessmentController.delete,
);

export default router;
