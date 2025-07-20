import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';

import {
  TestCaseCreateSchema,
  TestCaseUpdateSchema,
  TestCaseIdParamsSchema,
  CourseCodeAssessmentTestCaseIdParamsSchema,
} from './test-case.schema';
import { TestCaseController } from './test-case.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  validateParams(CourseCodeAssessmentTestCaseIdParamsSchema),
  TestCaseController.findAll
);

router.post(
  '/',
  adminMiddleware,
  validateParams(CourseCodeAssessmentTestCaseIdParamsSchema),
  validate(TestCaseCreateSchema),
  TestCaseController.create
);

router.get(
  '/:id',
  validateParams(TestCaseIdParamsSchema),
  TestCaseController.findById
);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(TestCaseIdParamsSchema),
  validate(TestCaseUpdateSchema),
  TestCaseController.update
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(TestCaseIdParamsSchema),
  TestCaseController.delete
);

export default router;
