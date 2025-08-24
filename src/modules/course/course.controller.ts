import type { Request, Response } from 'express';
import { CourseService } from './course.service';
import { CourseErrors } from './course.errors';
import type {
  CourseCreateType,
  CourseOrganizationIDQueryRequiredType,
  CourseOrganizationIDQueryType,
  CourseUpdateType,
} from './course.schema';

const {
  COURSE_NOT_FOUND,
  COURSES_FETCH_FAILED,
  COURSE_FETCH_FAILED,
  COURSE_CREATE_FAILED,
  COURSE_UPDATE_FAILED,
  COURSE_DELETE_FAILED,
} = CourseErrors;

export const CourseController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { organizationId }: CourseOrganizationIDQueryType = req.parsedQuery;
      const role = req.user?.role;
      const orgAdmin = req.user?.orgAdmin;
      const courses = await CourseService.findAll(userId, orgAdmin, role, organizationId);
      res.status(200).json({ courses });
    } catch (error: any) {
      res.status(COURSES_FETCH_FAILED.STATUS).json({
        error: COURSES_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findAllNonOrganizationCourses: async (req: Request, res: Response) => {
    try {
      const { organizationId }: CourseOrganizationIDQueryRequiredType = req.parsedQuery;

      const courses = await CourseService.findAllNonOrganizationCourses(organizationId);
      res.status(200).json({ courses });
    } catch (error: any) {
      res.status(COURSES_FETCH_FAILED.STATUS).json({
        error: COURSES_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const role = req.user?.role;
      const course = await CourseService.findById(id!, userId, orgAdmin, role);
      if (!course) {
        res.status(COURSE_NOT_FOUND.STATUS).json({
          error: COURSE_NOT_FOUND.MESSAGE,
        });
        return;
      }

      res.status(200).json({ course });
    } catch (error: any) {
      res.status(COURSE_FETCH_FAILED.STATUS).json({
        error: COURSE_FETCH_FAILED.MESSAGE,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const courseData: CourseCreateType = req.body;
      const course = await CourseService.create(courseData);
      res.status(201).json({ course });
    } catch (error: any) {
      res.status(COURSE_CREATE_FAILED.STATUS).json({
        error: COURSE_CREATE_FAILED.MESSAGE,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const courseData: CourseUpdateType = req.body;
      const updatedCourse = await CourseService.update(id!, courseData);
      if (!updatedCourse) {
        res.status(COURSE_NOT_FOUND.STATUS).json({
          error: COURSE_NOT_FOUND.MESSAGE,
        });
      }
      res.status(200).json({ course: updatedCourse });
    } catch (error: any) {
      res.status(COURSE_UPDATE_FAILED.STATUS).json({
        error: COURSE_UPDATE_FAILED.MESSAGE,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedCourse = await CourseService.delete(id!);
      if (!deletedCourse) {
        res.status(COURSE_NOT_FOUND.STATUS).json({
          error: COURSE_NOT_FOUND.MESSAGE,
        });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(COURSE_DELETE_FAILED.STATUS).json({
        error: COURSE_DELETE_FAILED.MESSAGE,
      });
    }
  },
};
