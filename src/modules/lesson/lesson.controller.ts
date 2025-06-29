import type { Request, Response } from 'express';
import { LessonService } from './lesson.service';
import { LessonErrors } from './lesson.errors';
import type { LessonCreateType, LessonUpdateType } from './lesson.schema';

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
      const lessons = await LessonService.findAll();
      res.status(200).json(lessons);
    } catch (error: any) {
      res.status(LESSONS_FETCH_FAILED.STATUS).json({
        error: LESSONS_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lesson = await LessonService.findById(id!);
      if (!lesson) {
        res.status(LESSON_NOT_FOUND.STATUS).json({
          error: LESSON_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json(lesson);
    } catch (error: any) {
      res.status(LESSON_FETCH_FAILED.STATUS).json({
        error: LESSON_FETCH_FAILED.MESSAGE,
      });
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const lessonData: LessonCreateType = req.body;
      const lesson = await LessonService.create(lessonData);
      res.status(201).json(lesson);
    } catch (error: any) {
      res.status(LESSON_CREATE_FAILED.STATUS).json({
        error: LESSON_CREATE_FAILED.MESSAGE,
      });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lessonData: LessonUpdateType = req.body;
      const updatedLesson = await LessonService.update(id!, lessonData);
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
      const { id } = req.params;
      const deleted = await LessonService.delete(id!);
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
