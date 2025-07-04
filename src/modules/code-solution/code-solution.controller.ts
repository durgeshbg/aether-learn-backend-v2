import type { Request, Response } from 'express';
import { CodeSolutionService } from './code-solution.service';
import { CodeSolutionErrors } from './code-solution.errors';
import type {
  CodeSolutionAssesmentIdParamType,
  CodeSolutionCreateType,
  CodeSolutionIdParamType,
  CodeSolutionScoreUpdateType,
  CodeSolutionStatusUpdateType,
} from './code-solution.schema';

const {
  CODE_SOLUTION_NOT_FOUND,
  CODE_SOLUTIONS_FETCH_FAILED,
  CODE_SOLUTION_FETCH_FAILED,
  CODE_SOLUTION_CREATE_FAILED,
  CODE_SOLUTION_UPDATE_FAILED,
} = CodeSolutionErrors;

export const CodeSolutionController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, codeAssessmentId } =
        req.params as CodeSolutionAssesmentIdParamType;
      const codeSolutions = await CodeSolutionService.findAll(codeAssessmentId);
      res.status(200).json(codeSolutions);
    } catch (error) {
      res
        .status(CODE_SOLUTIONS_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTIONS_FETCH_FAILED.MESSAGE });
    }
  },

  create: async (req: Request, res: Response) => {
    const { courseId, codeAssessmentId } =
      req.params as CodeSolutionAssesmentIdParamType;
    const userId = req?.user?.id!;
    const codeSolutionData: CodeSolutionCreateType = req.body;
    try {
      const newCodeSolution = await CodeSolutionService.create(
        codeSolutionData,
        codeAssessmentId,
        userId
      );
      res.status(201).json(newCodeSolution);
    } catch (error) {
      res
        .status(CODE_SOLUTION_CREATE_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_CREATE_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, codeAssessmentId, courseId } =
      req.params as CodeSolutionIdParamType;
    try {
      const codeSolution = await CodeSolutionService.findById(
        id,
        codeAssessmentId
      );
      if (!codeSolution) {
        res
          .status(CODE_SOLUTION_NOT_FOUND.STATUS)
          .json({ error: CODE_SOLUTION_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json(codeSolution);
    } catch (error) {
      res
        .status(CODE_SOLUTION_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_FETCH_FAILED.MESSAGE });
    }
  },

  findByUser: async (req: Request, res: Response) => {
    const userId = req?.user?.id!;
    const { codeAssessmentId, courseId } =
      req.params as CodeSolutionAssesmentIdParamType;
    try {
      const codeSolutions = await CodeSolutionService.findByUser(
        codeAssessmentId,
        userId
      );
      res.status(200).json(codeSolutions);
    } catch (error) {
      res
        .status(CODE_SOLUTIONS_FETCH_FAILED.STATUS)
        .json({ error: CODE_SOLUTIONS_FETCH_FAILED.MESSAGE });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    const { id, codeAssessmentId, courseId } =
      req.params as CodeSolutionIdParamType;
    const statusData: CodeSolutionStatusUpdateType = req.body;
    try {
      const updatedCodeSolution = await CodeSolutionService.updateStatus(
        id,
        codeAssessmentId,
        statusData
      );
      res.status(200).json(updatedCodeSolution);
    } catch (error) {
      res
        .status(CODE_SOLUTION_UPDATE_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_UPDATE_FAILED.MESSAGE });
    }
  },

  updateScore: async (req: Request, res: Response) => {
    const { id, codeAssessmentId, courseId } =
      req.params as CodeSolutionIdParamType;
    const scoreData: CodeSolutionScoreUpdateType = req.body;
    try {
      const updatedCodeSolution = await CodeSolutionService.updateScore(
        id,
        codeAssessmentId,
        scoreData
      );
      res.status(200).json(updatedCodeSolution);
    } catch (error) {
      res
        .status(CODE_SOLUTION_UPDATE_FAILED.STATUS)
        .json({ error: CODE_SOLUTION_UPDATE_FAILED.MESSAGE });
    }
  },
};
