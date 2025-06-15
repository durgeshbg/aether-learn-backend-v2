import express from 'express';
import { OrganizationController } from './organization.controller';
import { adminMiddleware, authMiddleware } from '../../middlewares/auth';
import { validate, validateParams } from '../../middlewares/validate';
import {
  CreateOrganizationSchema,
  OrganizationCourseUpdateSchema,
  OrganizationIdParamSchema,
  OrganizationUpdateSchema,
  OrganizationUserUpdateSchema,
} from './organization.schema';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', OrganizationController.findAll);

router.post(
  '/',
  validate(CreateOrganizationSchema),
  OrganizationController.create
);

router.get('/search', OrganizationController.findByName);

router.get(
  '/:id',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findById
);

router.put(
  '/:id',
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationUpdateSchema),
  OrganizationController.update
);

router.get(
  '/:id/users',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findAllUsers
);

router.put(
  '/:id/users',
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationUserUpdateSchema),
  OrganizationController.updateUsers
);

router.get(
  '/:id/courses',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findAllCourses
);

router.put(
  '/:id/courses',
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationCourseUpdateSchema),
  OrganizationController.updateCourses
);

router.delete(
  '/:id',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.delete
);

export default router;
