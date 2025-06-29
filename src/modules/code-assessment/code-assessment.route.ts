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

router.use(authMiddleware, adminMiddleware);

router.get(
  '/',
  validateParams(CodeAssessmentCourseIdParamsSchema),
  CodeAssessmentController.findAll
);

router.post(
  '/',
  validateParams(CodeAssessmentCourseIdParamsSchema),
  validate(CodeAssessmentCreateSchema),
  CodeAssessmentController.create
);

router.get(
  '/:id',
  validateParams(CodeAssessmentIdParamsSchema),
  CodeAssessmentController.findById
);

router.put(
  '/:id',
  validateParams(CodeAssessmentIdParamsSchema),
  validate(CodeAssessmentUpdateSchema),
  CodeAssessmentController.update
);

router.delete(
  '/:id',
  validateParams(CodeAssessmentIdParamsSchema),
  CodeAssessmentController.delete
);

export default router;
