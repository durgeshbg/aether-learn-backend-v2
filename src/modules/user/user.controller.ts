import { UserService } from './user.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import type {
  CreateUserType,
  UserLoginType,
  UserIdParamType,
  UserDetailsUpdateType,
  UserFilterQueryType,
  UserOrganizationIDQueryType,
  UserBookMarkModuleUpdateType,
  UserCourseEnrollmentUpdateType,
  UserMarkAsCompleteUpdateType,
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
  USER_COURSE_ENROLLMENT_FAILED,
  USER_MODULE_BOOKMARK_FAILED,
  USER_MARK_AS_COMPLETE_FAILED,
} = UserErrors;

export const UserController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const orgId: UserOrganizationIDQueryType['organizationId'] = (req.parsedQuery
        .organizationId || req.user?.orgAdmin) as string;
      const users = await UserService.findAll(orgId);
      res.status(200).json({ users });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  findNonOrganizationUsers: async (_req: Request, res: Response) => {
    try {
      const users = await UserService.findNonOrganizationUsers();
      res.status(200).json({ users });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  findBookMarkedModules: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const user = await UserService.findBookMarkedModules(userId!);
      res.status(200).json({ bookmarks: user?.bookmarkedModules || [] });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const { filter }: UserFilterQueryType = req.parsedQuery;
      const user = await UserService.findById(id!, filter);

      if (!user) {
        res.status(USER_NOT_FOUND.STATUS).json({ error: USER_NOT_FOUND.MESSAGE });
        return;
      }
      if (
        req.user?.role === Role.ADMIN ||
        req.user?.orgAdmin === user?.organization?.id ||
        id === req.user?.id
      ) {
        res.status(200).json({ user });
        return;
      }
      res.status(USER_FORBIDDEN.STATUS).json({
        error: USER_FORBIDDEN.MESSAGE,
      });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  getDashboardStats: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const orgAdmin = req.user?.orgAdmin;
      const dashboardData = await UserService.getDashboardStats(userId, orgAdmin!, role);

      res.status(200).json({ dashboardData });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  findUserProgress: async (req: Request, res: Response) => {
    try {
      const userId = req.params?.id;
      const { user, progress } = await UserService.findUserProgress(userId!);

      if (
        req.user?.role === Role.ADMIN ||
        req.user?.orgAdmin === user?.organization?.id ||
        userId === req.user?.id
      ) {
        res.status(200).json({ progress: progress || [] });
        return;
      }

      res.status(USER_FORBIDDEN.STATUS).json({
        error: USER_FORBIDDEN.MESSAGE,
      });
      return;
    } catch {
      res.status(SERVER_ERROR.STATUS).json({ error: SERVER_ERROR.MESSAGE });
      return;
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data: CreateUserType = req.body;
      data.password = await hash(data.password, 10);

      if (req.user?.orgAdmin) {
        data.organizationId = req.user.orgAdmin;
        data.orgAdmin = false;
        data.role = Role.USER;
      }

      const user = await UserService.create(data);
      res.status(201).json({ user });
      return;
    } catch {
      res.status(USER_EMAIL_EXISTS.STATUS).json({ error: USER_EMAIL_EXISTS.MESSAGE });
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
        },
      );
      res.status(200).json({ token });
      return;
    } catch (error) {
      console.error(error);
      res.status(USER_INVALID_CREDENTIALS.STATUS).json({ error: USER_INVALID_CREDENTIALS.MESSAGE });
      return;
    }
  },

  updateCourseEnrollment: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { courseId, enroll }: UserCourseEnrollmentUpdateType = req.body;
      const enrollmentData = await UserService.updateCourseEnrollment(userId!, courseId, enroll);
      if (enroll) {
        res.status(200).json({ enrollmentData });
      } else {
        res.status(204).json({
          message: 'User unenrolled from course successfully',
        });
      }

      return;
    } catch {
      res.status(USER_COURSE_ENROLLMENT_FAILED.STATUS).json({
        error: USER_COURSE_ENROLLMENT_FAILED.MESSAGE,
      });
      return;
    }
  },

  updateBookMarkModule: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { moduleId, bookmark }: UserBookMarkModuleUpdateType = req.body;
      const userBookmark = await UserService.updateBookMarkModule(userId!, moduleId, bookmark);
      if (bookmark) {
        res.status(200).json({ bookmark: userBookmark });
      } else {
        res.status(204).json({
          message: 'Module removed from bookmarks successfully',
        });
      }
      return;
    } catch {
      res.status(USER_MODULE_BOOKMARK_FAILED.STATUS).json({
        error: USER_MODULE_BOOKMARK_FAILED.MESSAGE,
      });
      return;
    }
  },

  updateModuleMarkAsComplete: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const parsedBody: UserMarkAsCompleteUpdateType = req.body;
      const userCourseProgress = await UserService.updateModuleMarkAsComplete(userId!, parsedBody);
      res.status(200).json({ progress: userCourseProgress });
      return;
    } catch {
      res.status(USER_MARK_AS_COMPLETE_FAILED.STATUS).json({
        error: USER_MARK_AS_COMPLETE_FAILED.MESSAGE,
      });
      return;
    }
  },

  updateDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const data: UserDetailsUpdateType = req.body;

      const user = await UserService.findById(id!);

      if (!user) {
        res.status(USER_NOT_FOUND.STATUS).json({ error: USER_NOT_FOUND.MESSAGE });
        return;
      }

      if (
        req.user?.role === Role.ADMIN ||
        req.user?.orgAdmin === user.organization?.id ||
        id === req.user?.id
      ) {
        if (data.password) {
          data.password = await hash(data.password, 10);
        }
        const user = await UserService.updateDetails(id!, data);
        res.status(200).json({ user });
        return;
      }

      res.status(USER_FORBIDDEN.STATUS).json({
        error: USER_FORBIDDEN.MESSAGE,
      });

      return;
    } catch {
      res.status(USER_UPDATE_FAILED.STATUS).json({ error: USER_UPDATE_FAILED.MESSAGE });
      return;
    }
  },

  updateOrganization: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as UserIdParamType;
      const { organizationId } = req.body;
      const user = await UserService.updateOrganization(id!, organizationId);
      res.status(200).json({ user });
      return;
    } catch {
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
      res.status(200).json({ user });
      return;
    } catch {
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
      if (req.user?.role === Role.ADMIN || req.user?.orgAdmin === user?.organization?.id) {
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
    } catch {
      res.status(USER_DELETE_FAILED.STATUS).json({
        error: USER_DELETE_FAILED.MESSAGE,
      });
      return;
    }
  },
};
