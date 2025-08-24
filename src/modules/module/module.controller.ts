import type { Request, Response } from 'express';
import { ModuleService } from './module.service';
import { ModuleErrors } from './module.errors.ts';
import type {
  ModuleCreateType,
  ModuleUpdateType,
  CourseLessonModuleIdParamsType,
  ModuleIdParamsType,
} from './module.schema';

const {
  MODULE_NOT_FOUND,
  MODULES_FETCH_FAILED,
  MODULE_FETCH_FAILED,
  MODULE_CREATE_FAILED,
  MODULE_UPDATE_FAILED,
  MODULE_DELETE_FAILED,
} = ModuleErrors;

export const ModuleController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, lessonId } = req.params as CourseLessonModuleIdParamsType;
      const userId = req.user?.id;
      const modules = await ModuleService.findAll(
        lessonId,
        courseId,
        userId,
        req.user?.role,
        req.user?.orgAdmin,
      );
      res.status(200).json({ modules });
    } catch (error) {
      res.status(MODULES_FETCH_FAILED.STATUS).json({ error: MODULES_FETCH_FAILED.MESSAGE });
    }
  },

  create: async (req: Request, res: Response) => {
    const { courseId, lessonId } = req.params as CourseLessonModuleIdParamsType;
    const moduleData: ModuleCreateType = req.body;
    try {
      const newModule = await ModuleService.create(lessonId, moduleData);
      res.status(201).json({ module: newModule });
    } catch (error) {
      res.status(MODULE_CREATE_FAILED.STATUS).json({ error: MODULE_CREATE_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, courseId, lessonId } = req.params as ModuleIdParamsType;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userOrgAdmin = req.user?.orgAdmin;
    try {
      const module = await ModuleService.findById(
        id,
        lessonId,
        courseId,
        userId,
        userRole,
        userOrgAdmin,
      );
      if (!module) {
        res.status(MODULE_NOT_FOUND.STATUS).json({ error: MODULE_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ module });
    } catch (error) {
      res.status(MODULE_FETCH_FAILED.STATUS).json({ error: MODULE_FETCH_FAILED.MESSAGE });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id, courseId, lessonId } = req.params as ModuleIdParamsType;
    const moduleData: ModuleUpdateType = req.body;
    try {
      const updatedModule = await ModuleService.update(id, lessonId, moduleData);
      if (!updatedModule) {
        res.status(MODULE_NOT_FOUND.STATUS).json({ error: MODULE_NOT_FOUND.MESSAGE });
      }
      res.status(200).json({ module: updatedModule });
    } catch (error) {
      res.status(MODULE_UPDATE_FAILED.STATUS).json({ error: MODULE_UPDATE_FAILED.MESSAGE });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id, courseId, lessonId } = req.params as ModuleIdParamsType;
    try {
      const deletedModule = await ModuleService.delete(id, lessonId);
      if (!deletedModule) {
        res.status(MODULE_NOT_FOUND.STATUS).json({ error: MODULE_NOT_FOUND.MESSAGE });
      }
      res.status(204).send();
    } catch (error) {
      res.status(MODULE_DELETE_FAILED.STATUS).json({ error: MODULE_DELETE_FAILED.MESSAGE });
    }
  },
};
