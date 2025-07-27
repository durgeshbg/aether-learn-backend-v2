import express from 'express';
import { UserController } from './user.controller';
import {
  adminMiddleware,
  authMiddleware,
  orgAdminMiddleware,
} from '../../middlewares/auth';
import {
  validate,
  validateParams,
  validateQuery,
} from '../../middlewares/validate';
import {
  CreateUserSchema,
  UserIdParamSchema,
  UserLoginSchema,
  UserDetailsUpdateSchema,
  UserRoleUpdateSchema,
  UserOrganizationUpdateSchema,
  UserOrganizationIDQuerySchema,
  UserFilterQuerySchema,
} from './user.schema';

const router = express.Router();

router.post('/login', validate(UserLoginSchema), UserController.login);

router.use(authMiddleware);

router.get(
  '/',
  orgAdminMiddleware,
  validateQuery(UserOrganizationIDQuerySchema),
  UserController.findAll
);

router.post(
  '/',
  orgAdminMiddleware,
  validate(CreateUserSchema),
  UserController.create
);

router.get(
  '/non-organization-users',
  adminMiddleware,
  UserController.findNonOrganizationUsers
);

router.get(
  '/:id',
  validateParams(UserIdParamSchema),
  validateQuery(UserFilterQuerySchema),
  UserController.findById
);

router.put(
  '/:id',
  validateParams(UserIdParamSchema),
  validate(UserDetailsUpdateSchema),
  UserController.updateDetails
);

router.put(
  '/:id/organization',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserOrganizationUpdateSchema),
  UserController.updateOrganization
);

router.put(
  '/:id/role',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserRoleUpdateSchema),
  UserController.updateRole
);

router.delete(
  '/:id',
  orgAdminMiddleware,
  validateParams(UserIdParamSchema),
  UserController.delete
);

export default router;
