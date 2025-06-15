import express from 'express';
import { UserController } from './user.controller';
import { authMiddleware, orgAdminMiddleware } from '../../middlewares/auth';
import { validate, validateParams } from '../../middlewares/validate';
import {
  CreateUserSchema,
  UserIdParamSchema,
  UserLoginSchema,
  UserUpdateSchema,
} from './user.schema';

const router = express.Router();

router.post('/login', validate(UserLoginSchema), UserController.login);

router.use(authMiddleware, orgAdminMiddleware);

router.get('/', authMiddleware, orgAdminMiddleware, UserController.findAll);

router.get('/:id', validateParams(UserIdParamSchema), UserController.findById);

router.post('/create', validate(CreateUserSchema), UserController.create);

router.put(
  '/:id',
  validate(UserUpdateSchema),
  validateParams(UserIdParamSchema),
  UserController.update
);

router.put(
  '/:id/organization',
  validateParams(UserIdParamSchema),
  UserController.updateOrganization
);

router.delete('/:id', validateParams(UserIdParamSchema), UserController.delete);

export default router;
