import express from 'express';
import { UserController } from './user.controller';
import {
  adminMiddleware,
  authMiddleware,
  orgAdminMiddleware,
} from '../../middlewares/auth';
import { validate, validateParams } from '../../middlewares/validate';
import {
  CreateUserSchema,
  UserIdParamSchema,
  UserLoginSchema,
  UserNameUpdateSchema,
  UserRoleUpdateSchema,
  UserOrgAdminUpdateScehma,
  UserOrganizationUpdateSchema,
} from './user.schema';

const router = express.Router();

router.post('/login', validate(UserLoginSchema), UserController.login);

router.use(authMiddleware);

router.get('/', adminMiddleware, UserController.findAll);

router.post(
  '/',
  orgAdminMiddleware,
  validate(CreateUserSchema),
  UserController.create
);

router.get(
  '/organization',
  orgAdminMiddleware,
  UserController.findAllInOrganization
);

router.get(
  '/organization/:id',
  orgAdminMiddleware,
  validateParams(UserIdParamSchema),
  UserController.findUserInOrganization
);

router.get(
  '/:id',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  UserController.findById
);

router.put(
  '/:id',
  validateParams(UserIdParamSchema),
  validate(UserNameUpdateSchema),
  UserController.updateName
);

router.put(
  '/:id/organization',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserOrganizationUpdateSchema),
  UserController.updateOrganization
);

router.put(
  '/:id/organization-admin',
  adminMiddleware,
  validateParams(UserIdParamSchema),
  validate(UserOrgAdminUpdateScehma),
  UserController.updateOrgAdmin
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
