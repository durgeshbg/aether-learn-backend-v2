import type { Request, Response } from 'express';
import { QuestionService } from './question.service';
import { QuestionErrors } from './question.errors';
import type {
  QuestionCreateType,
  QuestionUpdateType,
  QuestionQuizCourseIdParamsType,
  QuestionIdParamsType,
} from './question.schema';
const {
  QUESTION_NOT_FOUND,
  QUESTIONS_FETCH_FAILED,
  QUESTION_FETCH_FAILED,
  QUESTION_CREATE_FAILED,
  QUESTION_UPDATE_FAILED,
  QUESTION_DELETE_FAILED,
} = QuestionErrors;

export const QuestionController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, quizId } = req.params as QuestionQuizCourseIdParamsType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const questions = await QuestionService.findAll(quizId, courseId, userId, orgAdmin, userRole);
      res.status(200).json({ questions });
    } catch (error) {
      res.status(QUESTIONS_FETCH_FAILED.STATUS).json({ error: QUESTIONS_FETCH_FAILED.MESSAGE });
    }
  },

  create: async (req: Request, res: Response) => {
    const { courseId, quizId } = req.params as QuestionQuizCourseIdParamsType;
    const questionData: QuestionCreateType = req.body;
    try {
      const newQuestion = await QuestionService.create(quizId, questionData);
      res.status(201).json({ question: newQuestion });
    } catch (error) {
      res.status(QUESTION_CREATE_FAILED.STATUS).json({ error: QUESTION_CREATE_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, courseId, quizId } = req.params as QuestionIdParamsType;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userOrgAdmin = req.user?.orgAdmin;
    try {
      const question = await QuestionService.findById(
        id,
        quizId,
        courseId,
        userId,
        userOrgAdmin,
        userRole,
      );
      if (!question) {
        res.status(QUESTION_NOT_FOUND.STATUS).json({ error: QUESTION_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ question });
    } catch (error) {
      res.status(QUESTION_FETCH_FAILED.STATUS).json({ error: QUESTION_FETCH_FAILED.MESSAGE });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id, courseId, quizId } = req.params as QuestionIdParamsType;
    const questionData: QuestionUpdateType = req.body;
    try {
      const updatedQuestion = await QuestionService.update(id, quizId, questionData);
      if (!updatedQuestion) {
        res.status(QUESTION_NOT_FOUND.STATUS).json({ error: QUESTION_NOT_FOUND.MESSAGE });
      }
      res.status(200).json({ question: updatedQuestion });
    } catch (error) {
      res.status(QUESTION_UPDATE_FAILED.STATUS).json({ error: QUESTION_UPDATE_FAILED.MESSAGE });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id, courseId, quizId } = req.params as QuestionIdParamsType;
    try {
      const deletedQuestion = await QuestionService.delete(id, quizId);
      if (!deletedQuestion) {
        res.status(QUESTION_NOT_FOUND.STATUS).json({ error: QUESTION_NOT_FOUND.MESSAGE });
      }
      res.status(204).json({ message: 'Question deleted successfully' });
    } catch (error) {
      res.status(QUESTION_DELETE_FAILED.STATUS).json({ error: QUESTION_DELETE_FAILED.MESSAGE });
    }
  },
};
