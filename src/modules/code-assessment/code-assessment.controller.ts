import type { Request, Response } from 'express';
import { CodeAssessmentService } from './code-assessment.service';
import { CodeAssessmentErrors } from './code-assessment.errors';
import type {
  CodeAssessmentCreateType,
  CodeAssessmentUpdateType,
  CodeAssessmentCourseIdParamsType,
  CodeAssessmentIdParamsType,
} from './code-assessment.schema';

const {
  CODE_ASSESSMENT_NOT_FOUND,
  CODE_ASSESSMENTS_FETCH_FAILED,
  CODE_ASSESSMENT_FETCH_FAILED,
  CODE_ASSESSMENT_CREATE_FAILED,
  CODE_ASSESSMENT_UPDATE_FAILED,
  CODE_ASSESSMENT_DELETE_FAILED,
} = CodeAssessmentErrors;

export const CodeAssessmentController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as CodeAssessmentCourseIdParamsType;
      const uesrId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const codeAssessments = await CodeAssessmentService.findAll(
        courseId,
        uesrId,
        orgAdmin,
        userRole
      );
      res.status(200).json({ codeAssessments });
    } catch (error: any) {
      res.status(CODE_ASSESSMENTS_FETCH_FAILED.STATUS).json({
        error: CODE_ASSESSMENTS_FETCH_FAILED.MESSAGE,
      });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as CodeAssessmentIdParamsType;
      const uesrId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const codeAssessment = await CodeAssessmentService.findById(
        id,
        courseId,
        uesrId,
        orgAdmin,
        userRole
      );
      if (!codeAssessment) {
        res.status(CODE_ASSESSMENT_NOT_FOUND.STATUS).json({
          error: CODE_ASSESSMENT_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json({ codeAssessment });
    } catch (error: any) {
      res.status(CODE_ASSESSMENT_FETCH_FAILED.STATUS).json({
        error: CODE_ASSESSMENT_FETCH_FAILED.MESSAGE,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as CodeAssessmentCourseIdParamsType;
      const codeAssessmentData: CodeAssessmentCreateType = req.body;
      const codeAssessment = await CodeAssessmentService.create(
        courseId,
        codeAssessmentData
      );
      res.status(201).json({ codeAssessment });
    } catch (error: any) {
      res.status(CODE_ASSESSMENT_CREATE_FAILED.STATUS).json({
        error: CODE_ASSESSMENT_CREATE_FAILED.MESSAGE,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as CodeAssessmentIdParamsType;
      const codeAssessmentData: CodeAssessmentUpdateType = req.body;
      const updatedCodeAssessment = await CodeAssessmentService.update(
        id,
        courseId,
        codeAssessmentData
      );
      if (!updatedCodeAssessment) {
        res.status(CODE_ASSESSMENT_NOT_FOUND.STATUS).json({
          error: CODE_ASSESSMENT_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(200).json({ codeAssessment: updatedCodeAssessment });
    } catch (error: any) {
      res.status(CODE_ASSESSMENT_UPDATE_FAILED.STATUS).json({
        error: CODE_ASSESSMENT_UPDATE_FAILED.MESSAGE,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id, courseId } = req.params as CodeAssessmentIdParamsType;
      const deleted = await CodeAssessmentService.delete(id, courseId);
      if (!deleted) {
        res.status(CODE_ASSESSMENT_NOT_FOUND.STATUS).json({
          error: CODE_ASSESSMENT_NOT_FOUND.MESSAGE,
        });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(CODE_ASSESSMENT_DELETE_FAILED.STATUS).json({
        error: CODE_ASSESSMENT_DELETE_FAILED.MESSAGE,
      });
    }
  },
};
