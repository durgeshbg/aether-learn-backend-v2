import type { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import type {
  CreateOrganizationType,
  OrgAdminUpdateType,
  OrganizationCourseUpdateType,
  OrganizationIdParamType,
  OrganizationNameQueryType,
  OrganizationUpdateType,
  OrganizationUserUpdateType,
} from './organization.schema';
import { OrganizationErrors } from './organization.errors';

const {
  ORGANIZATIONS_FETCH_FAILED,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_FETCH_FAILED,
  ORGANIZATION_FETCH_FORBIDDEN,
  ORGANIZATIONS_NOT_FOUND,
  ORGANIZATION_SEARCH_FAILED,
  ORGANIZATION_CREATE_FAILED,
  ORGANIZATION_UPDATE_FAILED,
  ORGANIZATION_DELETE_FAILED,
  ORGANIZATION_USERS_FETCH_FAILED,
  ORGANIZATION_USERS_ADD_FAILED,
  ORGANIZATION_USERS_REMOVE_FAILED,
  ORGANIZATION_COURSES_FETCH_FAILED,
  ORGANIZATION_COURSE_ACCESS_FORBIDDEN,
  ORGANIZATION_COURSES_ADD_FAILED,
  ORGANIZATION_COURSES_REMOVE_FAILED,
  ORGANIZATION_ADMIN_UPDATE_FAILED,
} = OrganizationErrors;

export const OrganizationController = {
  findAll: async (_req: Request, res: Response) => {
    try {
      const organizations = await OrganizationService.findAll();
      res.status(200).json({ organizations });
    } catch {
      res.status(ORGANIZATIONS_FETCH_FAILED.STATUS).json({
        error: ORGANIZATIONS_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organization = await OrganizationService.findById(id!);

      if (!organization) {
        res.status(ORGANIZATION_NOT_FOUND.STATUS).json({
          error: ORGANIZATION_NOT_FOUND.MESSAGE,
        });
        return;
      }

      const users = organization?.users.map((user) => user.id);
      const userId = req.user?.id;

      if (req.user?.role === 'ADMIN' || req.user?.orgAdmin === id || users?.includes(userId!)) {
        res.status(200).json({ organization });
        return;
      }

      res.status(ORGANIZATION_FETCH_FORBIDDEN.STATUS).json({
        error: ORGANIZATION_FETCH_FORBIDDEN.MESSAGE,
      });
      return;
    } catch {
      res.status(ORGANIZATION_FETCH_FAILED.STATUS).json({
        error: ORGANIZATION_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findByName: async (req: Request, res: Response) => {
    try {
      const { name }: OrganizationNameQueryType = req.parsedQuery;
      const organizations = await OrganizationService.findByName(name);
      if (organizations.length === 0) {
        res.status(ORGANIZATIONS_NOT_FOUND.STATUS).json({
          error: ORGANIZATIONS_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json({ organizations });
    } catch {
      res.status(ORGANIZATION_SEARCH_FAILED.STATUS).json({
        error: ORGANIZATION_SEARCH_FAILED.MESSAGE,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data: CreateOrganizationType = req.body;
      const organization = await OrganizationService.create(data);
      res.status(201).json(organization);
    } catch {
      res.status(ORGANIZATION_CREATE_FAILED.STATUS).json({
        error: ORGANIZATION_CREATE_FAILED.MESSAGE,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (req.user?.orgAdmin === id || req.user?.role === 'ADMIN') {
        const data: OrganizationUpdateType = req.body;
        const organization = await OrganizationService.update(id!, data);
        res.status(200).json({ organization });
        return;
      }

      res.status(ORGANIZATION_UPDATE_FAILED.STATUS).json({
        error: ORGANIZATION_UPDATE_FAILED.MESSAGE,
      });
      return;
    } catch {
      res.status(ORGANIZATION_UPDATE_FAILED.STATUS).json({
        error: ORGANIZATION_UPDATE_FAILED.MESSAGE,
      });
    }
  },

  updateOrgAdmin: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as OrganizationIdParamType;
      if (req.user?.orgAdmin === id || req.user?.role === 'ADMIN') {
        const { userId }: OrgAdminUpdateType = req.body;
        const organization = await OrganizationService.updateOrgAdmin(id!, userId);
        res.status(200).json({ organization });
        return;
      }
      res.status(ORGANIZATION_ADMIN_UPDATE_FAILED.STATUS).json({
        error: ORGANIZATION_ADMIN_UPDATE_FAILED.MESSAGE,
      });
      return;
    } catch {
      res
        .status(ORGANIZATION_ADMIN_UPDATE_FAILED.STATUS)
        .json({ error: ORGANIZATION_ADMIN_UPDATE_FAILED.MESSAGE });
      return;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await OrganizationService.delete(id!);
      res.status(204).json({ message: 'Organization deleted successfully' });
    } catch {
      res.status(ORGANIZATION_DELETE_FAILED.STATUS).json({
        error: ORGANIZATION_DELETE_FAILED.MESSAGE,
      });
    }
  },

  // Users
  addUsers: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userIds }: OrganizationUserUpdateType = req.body;
      const organization = await OrganizationService.addUsers(id!, userIds);
      res.status(200).json({ organization });
    } catch {
      res.status(ORGANIZATION_USERS_ADD_FAILED.STATUS).json({
        error: ORGANIZATION_USERS_ADD_FAILED.MESSAGE,
      });
    }
  },

  removeUsers: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userIds }: OrganizationUserUpdateType = req.body;
      const organization = await OrganizationService.removeUsers(id!, userIds);
      res.status(200).json({ organization });
    } catch {
      res.status(ORGANIZATION_USERS_REMOVE_FAILED.STATUS).json({
        error: ORGANIZATION_USERS_REMOVE_FAILED.MESSAGE,
      });
    }
  },

  findAllUsers: async (req: Request, res: Response) => {
    try {
      if (req.user?.role === 'ADMIN' || req.user?.orgAdmin === req.params.id) {
        const { id } = req.params;
        const users = await OrganizationService.findAllUsers(id!);
        res.status(200).json({ users });
        return;
      }
      res.status(ORGANIZATION_USERS_FETCH_FAILED.STATUS).json({
        error: ORGANIZATION_USERS_FETCH_FAILED.MESSAGE,
      });
      return;
    } catch {
      res.status(ORGANIZATION_USERS_FETCH_FAILED.STATUS).json({
        error: ORGANIZATION_USERS_FETCH_FAILED.MESSAGE,
      });
    }
  },

  // Courses
  addCourses: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { courseIds }: OrganizationCourseUpdateType = req.body;
      const organization = await OrganizationService.addCourses(id!, courseIds);
      res.status(200).json({ organization });
      return;
    } catch {
      res.status(ORGANIZATION_COURSES_ADD_FAILED.STATUS).json({
        error: ORGANIZATION_COURSES_ADD_FAILED.MESSAGE,
      });
    }
  },

  removeCourses: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { courseIds }: OrganizationCourseUpdateType = req.body;
      const organization = await OrganizationService.removeCourses(id!, courseIds);
      res.status(200).json({ organization });
      return;
    } catch {
      res.status(ORGANIZATION_COURSES_REMOVE_FAILED.STATUS).json({
        error: ORGANIZATION_COURSES_REMOVE_FAILED.MESSAGE,
      });
    }
  },

  findAllCourses: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organization = await OrganizationService.findById(id!);

      if (!organization) {
        res.status(ORGANIZATION_NOT_FOUND.STATUS).json({
          error: ORGANIZATION_NOT_FOUND.MESSAGE,
        });
        return;
      }

      const users = organization?.users.map((user) => user.id);
      const userId = req.user?.id;

      if (
        req.user?.role === 'ADMIN' ||
        req.user?.orgAdmin === organization.id ||
        users?.includes(userId!)
      ) {
        const courses = await OrganizationService.findAllCourses(id!);
        res.status(200).json({ courses });
        return;
      }
      res.status(ORGANIZATION_COURSE_ACCESS_FORBIDDEN.STATUS).json({
        error: ORGANIZATION_COURSE_ACCESS_FORBIDDEN.MESSAGE,
      });
      return;
    } catch {
      res.status(ORGANIZATION_COURSES_FETCH_FAILED.STATUS).json({
        error: ORGANIZATION_COURSES_FETCH_FAILED.MESSAGE,
      });
    }
  },
};
