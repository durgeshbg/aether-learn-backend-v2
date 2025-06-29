import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  ModuleCreateSchema,
  ModuleUpdateSchema,
  ModuleIdParamsSchema,
  CourseLessonModuleIdParamSchema,
} from './module.schema';
import { ModuleController } from './module.controller';
import { validate, validateParams } from '../../middlewares/validate';

const router = Router({mergeParams: true});

router.use(authMiddleware, adminMiddleware);

router.get(
  '/',
  validateParams(CourseLessonModuleIdParamSchema),
  ModuleController.findAll
);

router.post(
  '/',
  validateParams(CourseLessonModuleIdParamSchema),
  validate(ModuleCreateSchema),
  ModuleController.create
);

router.get(
  '/:id',
  validateParams(ModuleIdParamsSchema),
  ModuleController.findById
);

router.put(
  '/:id',
  validateParams(ModuleIdParamsSchema),
  validate(ModuleUpdateSchema),
  ModuleController.update
);

router.delete(
  '/:id',
  validateParams(ModuleIdParamsSchema),
  ModuleController.delete
);

export default router;
