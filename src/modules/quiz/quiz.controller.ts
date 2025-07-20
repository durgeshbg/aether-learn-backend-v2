import type { Request, Response } from 'express';
import { QuizService } from './quiz.service';
import { QuizErrors } from './quiz.errors';
import type {
  QuizCreateType,
  QuizUpdateType,
  QuizCourseIdParamsType,
  QuizIdParamsType,
} from './quiz.schema';

const {
  QUIZ_NOT_FOUND,
  QUIZZES_FETCH_FAILED,
  QUIZ_FETCH_FAILED,
  QUIZ_CREATE_FAILED,
  QUIZ_UPDATE_FAILED,
  QUIZ_DELETE_FAILED,
} = QuizErrors;

export const QuizController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as QuizCourseIdParamsType;
      const uesrId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const quizzes = await QuizService.findAll(
        courseId,
        uesrId,
        orgAdmin,
        userRole
      );
      res.status(200).json({ quizzes });
    } catch (error: any) {
      res.status(QUIZZES_FETCH_FAILED.STATUS).json({
        error: QUIZZES_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as QuizIdParamsType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const quiz = await QuizService.findById(
        id,
        courseId,
        userId,
        orgAdmin,
        userRole
      );
      if (!quiz) {
        res.status(QUIZ_NOT_FOUND.STATUS).json({
          error: QUIZ_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json({ quiz });
    } catch (error: any) {
      res.status(QUIZ_FETCH_FAILED.STATUS).json({
        error: QUIZ_FETCH_FAILED.MESSAGE,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as QuizCourseIdParamsType;
      const quizData: QuizCreateType = req.body;
      const quiz = await QuizService.create(courseId, quizData);
      res.status(201).json({ quiz });
    } catch (error: any) {
      res.status(QUIZ_CREATE_FAILED.STATUS).json({
        error: QUIZ_CREATE_FAILED.MESSAGE,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as QuizIdParamsType;
      const quizData: QuizUpdateType = req.body;
      const updatedQuiz = await QuizService.update(id, courseId, quizData);
      if (!updatedQuiz) {
        res.status(QUIZ_NOT_FOUND.STATUS).json({
          error: QUIZ_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json({ quiz: updatedQuiz });
    } catch (error: any) {
      res.status(QUIZ_UPDATE_FAILED.STATUS).json({
        error: QUIZ_UPDATE_FAILED.MESSAGE,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as QuizIdParamsType;
      const deletedQuiz = await QuizService.delete(id, courseId);
      if (!deletedQuiz) {
        res.status(QUIZ_NOT_FOUND.STATUS).json({
          error: QUIZ_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(QUIZ_DELETE_FAILED.STATUS).json({
        error: QUIZ_DELETE_FAILED.MESSAGE,
      });
    }
  },
};
