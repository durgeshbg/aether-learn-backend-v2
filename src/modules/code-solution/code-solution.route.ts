import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  CodeSolutionCreateSchema,
  CodeSolutionAssesmentIdParamSchema,
  CodeSolutionIdParamSchema,
  CodeSolutionScoreUpdateSchema,
  CodeSolutionStatusUpdateSchema,
} from './code-solution.schema';
import { CodeSolutionController } from './code-solution.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  validateParams(CodeSolutionAssesmentIdParamSchema),
  CodeSolutionController.findAll
);

router.post(
  '/',
  validateParams(CodeSolutionAssesmentIdParamSchema),
  validate(CodeSolutionCreateSchema),
  CodeSolutionController.create
);

router.get(
  '/:id',
  validateParams(CodeSolutionIdParamSchema),
  CodeSolutionController.findById
);

router.put(
  '/:id/score',
  adminMiddleware,
  validateParams(CodeSolutionIdParamSchema),
  validate(CodeSolutionScoreUpdateSchema),
  CodeSolutionController.updateScore
);

router.put(
  '/:id/status',
  adminMiddleware,
  validateParams(CodeSolutionIdParamSchema),
  validate(CodeSolutionStatusUpdateSchema),
  CodeSolutionController.updateStatus
);

export default router;
