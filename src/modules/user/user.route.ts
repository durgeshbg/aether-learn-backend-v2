import express from 'express';
import { UserController } from './user.controller';
import { adminMiddleware, authMiddleware, orgAdminMiddleware } from '../../middlewares/auth';
import { validate, validateParams, validateQuery } from '../../middlewares/validate';
import {
  CreateUserSchema,
  UserIdParamSchema,
  UserLoginSchema,
  UserDetailsUpdateSchema,
  UserRoleUpdateSchema,
  UserOrganizationUpdateSchema,
  UserOrganizationIDQuerySchema,
  UserFilterQuerySchema,
  UserCourseEnrollmentUpdateSchema,
  UserBookMarkModuleUpdateSchema,
  UserMarkAsCompleteUpdateSchema,
} from './user.schema';

const router = express.Router();

router.post('/login', validate(UserLoginSchema), UserController.login);

router.use(authMiddleware);

router.put(
  '/enroll-course',
  validate(UserCourseEnrollmentUpdateSchema),
  UserController.updateCourseEnrollment,
);

router.put(
  '/bookmark-module',
  validate(UserBookMarkModuleUpdateSchema),
  UserController.updateBookMarkModule,
);

router.put(
  '/mark-module-as-complete',
  validate(UserMarkAsCompleteUpdateSchema),
  UserController.updateModuleMarkAsComplete,
);

router.get(
  '/',
  orgAdminMiddleware,
  validateQuery(UserOrganizationIDQuerySchema),
  UserController.findAll,
);

router.post('/', orgAdminMiddleware, validate(CreateUserSchema), UserController.create);

router.get('/non-organization-users', adminMiddleware, UserController.findNonOrganizationUsers);

router.get(
  '/:id',
  validateParams(UserIdParamSchema),
  validateQuery(UserFilterQuerySchema),
  UserController.findById,
);

router.get('/:id/progress', validateParams(UserIdParamSchema), UserController.findUserProgress);

router.put(
  '/:id',
  validateParams(UserIdParamSchema),
  validate(UserDetailsUpdateSchema),
  UserController.updateDetails,
);

router.put(
  '/:id/organization',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserOrganizationUpdateSchema),
  UserController.updateOrganization,
);

router.put(
  '/:id/role',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserRoleUpdateSchema),
  UserController.updateRole,
);

router.delete('/:id', orgAdminMiddleware, validateParams(UserIdParamSchema), UserController.delete);

export default router;
