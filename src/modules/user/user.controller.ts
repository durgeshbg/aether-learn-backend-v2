import { UserService } from './user.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import type {
  CreateUserType,
  UserLoginType,
  UserIdParamType,
} from './user.schema';
import { hash } from 'bcrypt-ts';

export const UserController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const users = await UserService.findAll();
      res.status(200).json(users);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const user = await UserService.findById(id!);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(400).json({ error: 'User Email already exists' });
      return;
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password }: UserLoginType = req.body;
      const user = await UserService.login(email, password);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
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
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
      return;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      if (id === req.user?.id) {
        res.status(403).json({ error: 'You cannot delete your own account' });
        return;
      }
      const user = await UserService.findById(id!);
      if (
        req.user?.role === 'ADMIN' ||
        req.user?.orgAdmin === user?.organizationId
      ) {
        await UserService.delete(id!);
        res.status(204).json({
          message: 'User deleted successfully',
        });
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  },
};
