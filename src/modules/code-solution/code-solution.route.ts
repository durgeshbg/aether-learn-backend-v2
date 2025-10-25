import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import {
  CodeSolutionCreateSchema,
  CodeSolutionAssesmentIdParamSchema,
  CodeSolutionIdParamSchema,
} from './code-solution.schema';
import { CodeSolutionController } from './code-solution.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', validateParams(CodeSolutionAssesmentIdParamSchema), CodeSolutionController.findAll);

router.post(
  '/run',
  validateParams(CodeSolutionAssesmentIdParamSchema),
  validate(CodeSolutionCreateSchema),
  CodeSolutionController.run,
);

router.post(
  '/submit',
  validateParams(CodeSolutionAssesmentIdParamSchema),
  validate(CodeSolutionCreateSchema),
  CodeSolutionController.submit,
);

router.get('/:id', validateParams(CodeSolutionIdParamSchema), CodeSolutionController.findById);

router.get(
  '/:id/status',
  validateParams(CodeSolutionIdParamSchema),
  CodeSolutionController.getStatus,
);

export default router;
