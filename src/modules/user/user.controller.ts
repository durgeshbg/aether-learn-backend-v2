import { UserService } from './user.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import type {
  CreateUserType,
  UserLoginType,
  UserIdParamType,
} from './user.schema';
import { hash } from 'bcrypt-ts';
import { UserErrors } from './user.errors';
import { Role } from '../../generated/prisma';

const {
  USER_NOT_FOUND,
  SERVER_ERROR,
  USER_EMAIL_EXISTS,
  USER_INVALID_CREDENTIALS,
  USER_UPDATE_FAILED,
  USER_DELETE_FAILED,
  USER_OWN_ACCOUNT_DELETION,
  USER_FORBIDDEN,
  USER_INVALID_ORGANIZATION,
} = UserErrors;

export const UserController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const users = await UserService.findAll();
      res.status(200).json(users);
      return;
    } catch (error: any) {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const user = await UserService.findById(id!);
      if (!user) {
        res
          .status(USER_NOT_FOUND.STATUS)
          .json({ error: USER_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json(user);
      return;
    } catch (error: any) {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data: CreateUserType & { organizationId?: string | null } =
        req.body;
      data.password = await hash(data.password, 10);
      data.organizationId = req.user?.orgAdmin;
      const user = await UserService.create(data);
      user.password = '';
      res.status(201).json(user);
      return;
    } catch (error: any) {
      res
        .status(USER_EMAIL_EXISTS.STATUS)
        .json({ error: USER_EMAIL_EXISTS.MESSAGE });
      return;
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password }: UserLoginType = req.body;
      const user = await UserService.login(email, password);
      if (!user) {
        res
          .status(USER_INVALID_CREDENTIALS.STATUS)
          .json({ error: USER_INVALID_CREDENTIALS.MESSAGE });
        return;
      }
      const orgAdmin = user.orgAdminOf?.id;
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          orgAdmin,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: '24h',
        }
      );
      res.status(200).json({ token });
      return;
    } catch (error: any) {
      res
        .status(USER_INVALID_CREDENTIALS.STATUS)
        .json({ error: USER_INVALID_CREDENTIALS.MESSAGE });
      return;
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const data = req.body;
      const user = await UserService.update(id!, data);
      res.status(200).json(user);
      return;
    } catch (error: any) {
      res
        .status(USER_UPDATE_FAILED.STATUS)
        .json({ error: USER_UPDATE_FAILED.MESSAGE });
      return;
    }
  },

  updateOrganization: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const { organizationId } = req.body;
      const user = await UserService.updateOrganization(id!, organizationId);
      res.status(200).json(user);
      return;
    } catch (error: any) {
      res
        .status(USER_INVALID_ORGANIZATION.STATUS)
        .json({ error: USER_INVALID_ORGANIZATION.MESSAGE });
      return;
    }
  },

  updateRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const { role } = req.body;
      const user = await UserService.updateRole(id!, role);
      res.status(200).json(user);
      return;
    } catch (error: any) {
      res.status(USER_UPDATE_FAILED.STATUS).json({
        error: USER_UPDATE_FAILED.MESSAGE,
      });
      return;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      if (id === req.user?.id) {
        res.status(USER_OWN_ACCOUNT_DELETION.STATUS).json({
          error: USER_OWN_ACCOUNT_DELETION.MESSAGE,
        });
        return;
      }
      const user = await UserService.findById(id!);
      if (
        req.user?.role === Role.ADMIN ||
        req.user?.orgAdmin === user?.organizationId
      ) {
        await UserService.delete(id!);
        res.status(204).json({
          message: 'User deleted successfully',
        });
      } else {
        res.status(USER_FORBIDDEN.STATUS).json({
          error: USER_FORBIDDEN.MESSAGE,
        });
      }
      return;
    } catch (error: any) {
      res.status(USER_DELETE_FAILED.STATUS).json({
        error: USER_DELETE_FAILED.MESSAGE,
      });
      return;
    }
  },
};
