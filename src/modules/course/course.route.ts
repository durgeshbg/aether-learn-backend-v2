import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import {
  CourseCreateSchema,
  CourseIdParamSchema,
  CourseOrganizationIDQuerySchema,
  CourseUpdateSchema,
} from './course.schema';
import { CourseController } from './course.controller';
import { validate, validateParams, validateQuery } from '../../middlewares/validate';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(CourseOrganizationIDQuerySchema), CourseController.findAll);

router.post('/', adminMiddleware, validate(CourseCreateSchema), CourseController.create);

router.get(
  '/non-organization-courses',
  adminMiddleware,
  validateQuery(CourseOrganizationIDQuerySchema),
  CourseController.findAllNonOrganizationCourses,
);

router.get('/:id', validateParams(CourseIdParamSchema), CourseController.findById);

router.put(
  '/:id',
  adminMiddleware,
  validateParams(CourseIdParamSchema),
  validate(CourseUpdateSchema),
  CourseController.update,
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(CourseIdParamSchema),
  CourseController.delete,
);

export default router;
