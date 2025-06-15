import type { Request, Response } from 'express';
import { OrganizationService } from './organization.service';

export const OrganizationController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const organization = await OrganizationService.create(data);
      res.status(201).json(organization);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const organization = await OrganizationService.update(id!, data);
      res.status(200).json(organization);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  updateUsers: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      const organization = await OrganizationService.updateUsers(id!, userIds);
      res.status(200).json(organization);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  updateCourses: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { courseIds } = req.body;
      const organization = await OrganizationService.updateCourses(
        id!,
        courseIds
      );
      res.status(200).json(organization);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await OrganizationService.delete(id!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  findAllUsers: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const users = await OrganizationService.findAllUsers(id!);
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  findAllCourses: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const courses = await OrganizationService.findAllCourses(id!);
      res.status(200).json(courses);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const organizations = await OrganizationService.findAll();
      res.status(200).json(organizations);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organization = await OrganizationService.findById(id!);
      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }
      res.status(200).json(organization);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
  findByName: async (req: Request, res: Response) => {
    try {
      const { name } = req.query;
      if (typeof name !== 'string') {
        res.status(400).json({ error: 'Invalid name parameter' });
        return;
      }
      const organizations = await OrganizationService.findByName(name);
      if (organizations.length === 0) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }
      res.status(200).json(organizations);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
