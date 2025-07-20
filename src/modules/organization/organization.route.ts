import express from 'express';
import { OrganizationController } from './organization.controller';
import {
  adminMiddleware,
  authMiddleware,
  orgAdminMiddleware,
} from '../../middlewares/auth';
import { validate, validateParams } from '../../middlewares/validate';
import {
  CreateOrganizationSchema,
  OrgAdminUpdateScehma,
  OrganizationCourseUpdateSchema,
  OrganizationIdParamSchema,
  OrganizationUpdateSchema,
  OrganizationUserUpdateSchema,
} from './organization.schema';

const router = express.Router();

router.use(authMiddleware);

router.get('/', adminMiddleware, OrganizationController.findAll);

router.get('/search', adminMiddleware, OrganizationController.findByName);

router.post(
  '/',
  adminMiddleware,
  validate(CreateOrganizationSchema),
  OrganizationController.create
);

router.get(
  '/:id',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findById
);

router.put(
  '/:id',
  orgAdminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationUpdateSchema),
  OrganizationController.update
);

router.delete(
  '/:id',
  adminMiddleware,
  validateParams(OrganizationIdParamSchema),
  OrganizationController.delete
);

// Admin update
router.put(
  '/:id/admin',
  orgAdminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrgAdminUpdateScehma),
  OrganizationController.updateOrgAdmin
);

// Users
router.get(
  '/:id/users',
  orgAdminMiddleware,
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findAllUsers
);

router.put(
  '/:id/users',
  orgAdminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationUserUpdateSchema),
  OrganizationController.addUsers
);

router.delete(
  '/:id/users',
  orgAdminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationUserUpdateSchema),
  OrganizationController.removeUsers
);

// Courses
router.get(
  '/:id/courses',
  validateParams(OrganizationIdParamSchema),
  OrganizationController.findAllCourses
);

router.put(
  '/:id/courses',
  adminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationCourseUpdateSchema),
  OrganizationController.addCourses
);

router.delete(
  '/:id/courses',
  adminMiddleware,
  validateParams(OrganizationIdParamSchema),
  validate(OrganizationCourseUpdateSchema),
  OrganizationController.removeCourses
);

export default router;
