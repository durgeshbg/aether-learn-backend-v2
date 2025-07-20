import type { Request, Response } from 'express';
import { LessonService } from './lesson.service';
import { LessonErrors } from './lesson.errors';
import type {
  LessonCreateType,
  LessonUpdateType,
  LessonCourseIdParamsType,
  LessonIdParamsType,
} from './lesson.schema';

const {
  LESSON_NOT_FOUND,
  LESSONS_FETCH_FAILED,
  LESSON_FETCH_FAILED,
  LESSON_CREATE_FAILED,
  LESSON_UPDATE_FAILED,
  LESSON_DELETE_FAILED,
} = LessonErrors;

export const LessonController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as LessonCourseIdParamsType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const lessons = await LessonService.findAll(
        courseId,
        userId,
        orgAdmin,
        userRole
      );

      res.status(200).json({
        lessons,
      });
      return;
    } catch (error: any) {
      res.status(LESSONS_FETCH_FAILED.STATUS).json({
        error: LESSONS_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as LessonIdParamsType;
      const userId = req.user?.id;
      const lesson = await LessonService.findById(
        id,
        courseId,
        userId,
        req.user?.orgAdmin,
        req.user?.role
      );
      if (!lesson) {
        res.status(LESSON_NOT_FOUND.STATUS).json({
          error: LESSON_NOT_FOUND.MESSAGE,
        });
        return;
      }

      res.status(200).json({ lesson });
      return;
    } catch (error: any) {
      res.status(LESSON_FETCH_FAILED.STATUS).json({
        error: LESSON_FETCH_FAILED.MESSAGE,
      });
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as LessonCourseIdParamsType;
      const lessonData: LessonCreateType = req.body;
      const lesson = await LessonService.create(courseId, lessonData);
      res.status(201).json(lesson);
    } catch (error: any) {
      res.status(LESSON_CREATE_FAILED.STATUS).json({
        error: LESSON_CREATE_FAILED.MESSAGE,
      });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as LessonIdParamsType;
      const lessonData: LessonUpdateType = req.body;
      const updatedLesson = await LessonService.update(
        id,
        courseId,
        lessonData
      );
      if (!updatedLesson) {
        res.status(LESSON_NOT_FOUND.STATUS).json({
          error: LESSON_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json(updatedLesson);
    } catch (error: any) {
      res.status(LESSON_UPDATE_FAILED.STATUS).json({
        error: LESSON_UPDATE_FAILED.MESSAGE,
      });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as LessonIdParamsType;
      const deleted = await LessonService.delete(id, courseId);
      if (!deleted) {
        res.status(LESSON_NOT_FOUND.STATUS).json({
          error: LESSON_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(LESSON_DELETE_FAILED.STATUS).json({
        error: LESSON_DELETE_FAILED.MESSAGE,
      });
    }
  },
};
