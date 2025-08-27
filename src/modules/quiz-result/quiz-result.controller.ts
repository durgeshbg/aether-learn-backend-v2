import type { Request, Response } from 'express';
import { QuizResultService } from './quiz-result.service';
import { QuizResultErrors } from './quiz-result.errors';
import type {
  QuizResultCreateType,
  QuizResultQuizIdParamsType,
  QuizResultIdParamsType,
} from './quiz-result.schema';
import { QuestionService } from '../question/question.service';

const {
  QUIZ_RESULT_NOT_FOUND,
  QUIZ_RESULTS_FETCH_FAILED,
  QUIZ_RESULT_FETCH_FAILED,
  QUIZ_RESULT_CREATE_FAILED,
  QUIZ_RESULT_DELETE_FAILED,
} = QuizResultErrors;

export const QuizResultController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, quizId } = req.params as QuizResultQuizIdParamsType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const quizResults = await QuizResultService.findAll(
        quizId,
        courseId,
        userId,
        orgAdmin,
        userRole,
      );
      res.status(200).json({ quizResults });
    } catch {
      res
        .status(QUIZ_RESULTS_FETCH_FAILED.STATUS)
        .json({ error: QUIZ_RESULTS_FETCH_FAILED.MESSAGE });
    }
  },

  create: async (req: Request, res: Response) => {
    const { quizId, courseId } = req.params as QuizResultQuizIdParamsType;
    const userId = req.user?.id;
    const quizResultData: QuizResultCreateType = req.body;
    try {
      const questions = await QuestionService.findAll(quizId, courseId, userId);
      let score = 0;
      quizResultData.answers.forEach((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (question && question.answer === answer.answer) {
          score += 1;
        }
      });
      const newQuizResult = await QuizResultService.create(quizId, userId!, courseId, score);
      res.status(201).json({ quizResult: newQuizResult });
    } catch {
      res
        .status(QUIZ_RESULT_CREATE_FAILED.STATUS)
        .json({ error: QUIZ_RESULT_CREATE_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, quizId, courseId } = req.params as QuizResultIdParamsType;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userOrgAdmin = req.user?.orgAdmin;
    try {
      const quizResult = await QuizResultService.findById(
        id,
        quizId,
        courseId,
        userId,
        userOrgAdmin,
        userRole,
      );
      if (!quizResult) {
        res.status(QUIZ_RESULT_NOT_FOUND.STATUS).json({ error: QUIZ_RESULT_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ quizResult });
    } catch {
      res.status(QUIZ_RESULT_FETCH_FAILED.STATUS).json({ error: QUIZ_RESULT_FETCH_FAILED.MESSAGE });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id, quizId } = req.params as QuizResultIdParamsType;
    try {
      await QuizResultService.delete(id, quizId);
      res.status(204).send();
    } catch {
      res
        .status(QUIZ_RESULT_DELETE_FAILED.STATUS)
        .json({ error: QUIZ_RESULT_DELETE_FAILED.MESSAGE });
    }
  },
};
