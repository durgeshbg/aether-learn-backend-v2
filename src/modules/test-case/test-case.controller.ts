import type { Request, Response } from 'express';
import { TestCaseService } from './test-case.service';
import { TestCaseErrors } from './test-case.errors';
import type {
  TestCaseCreateType,
  TestCaseUpdateType,
  TestCaseIdParamsType,
  CourseCodeAssessmentTestCaseIdParamsType,
} from './test-case.schema';

const {
  TEST_CASE_NOT_FOUND,
  TEST_CASES_FETCH_FAILED,
  TEST_CASE_FETCH_FAILED,
  TEST_CASE_CREATE_FAILED,
  TEST_CASE_UPDATE_FAILED,
  TEST_CASE_DELETE_FAILED,
} = TestCaseErrors;

export const TestCaseController = {
  findAll: async (req: Request, res: Response) => {
    try {
      const { courseId, codeAssessmentId } =
        req.params as CourseCodeAssessmentTestCaseIdParamsType;
      const userId = req.user?.id;
      const orgAdmin = req.user?.orgAdmin;
      const userRole = req.user?.role;
      const testCases = await TestCaseService.findAll(
        codeAssessmentId,
        courseId,
        userId,
        orgAdmin,
        userRole
      );
      res.status(200).json({ testCases });
    } catch (error) {
      res
        .status(TEST_CASES_FETCH_FAILED.STATUS)
        .json({ error: TEST_CASES_FETCH_FAILED.MESSAGE });
    }
  },

  create: async (req: Request, res: Response) => {
    const { courseId, codeAssessmentId } =
      req.params as CourseCodeAssessmentTestCaseIdParamsType;
    const testCaseData: TestCaseCreateType = req.body;
    try {
      const newTestCase = await TestCaseService.create(
        codeAssessmentId,
        testCaseData
      );
      res.status(201).json({ testCase: newTestCase });
    } catch (error) {
      res
        .status(TEST_CASE_CREATE_FAILED.STATUS)
        .json({ error: TEST_CASE_CREATE_FAILED.MESSAGE });
    }
  },

  findById: async (req: Request, res: Response) => {
    const { id, courseId, codeAssessmentId } =
      req.params as TestCaseIdParamsType;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userOrgAdmin = req.user?.orgAdmin;
    try {
      const testCase = await TestCaseService.findById(
        id,
        codeAssessmentId,
        courseId,
        userId,
        userOrgAdmin,
        userRole
      );
      if (!testCase) {
        res
          .status(TEST_CASE_NOT_FOUND.STATUS)
          .json({ error: TEST_CASE_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ testCase });
    } catch (error) {
      res
        .status(TEST_CASE_FETCH_FAILED.STATUS)
        .json({ error: TEST_CASE_FETCH_FAILED.MESSAGE });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id, courseId, codeAssessmentId } =
      req.params as TestCaseIdParamsType;
    const testCaseData: TestCaseUpdateType = req.body;
    try {
      const updatedTestCase = await TestCaseService.update(
        id,
        codeAssessmentId,
        testCaseData
      );
      if (!updatedTestCase) {
        res
          .status(TEST_CASE_NOT_FOUND.STATUS)
          .json({ error: TEST_CASE_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(200).json({ testCase: updatedTestCase });
    } catch (error) {
      res
        .status(TEST_CASE_UPDATE_FAILED.STATUS)
        .json({ error: TEST_CASE_UPDATE_FAILED.MESSAGE });
    }
  },
  delete: async (req: Request, res: Response) => {
    const { id, courseId, codeAssessmentId } =
      req.params as TestCaseIdParamsType;
    try {
      const deletedTestCase = await TestCaseService.delete(
        id,
        codeAssessmentId
      );
      if (!deletedTestCase) {
        res
          .status(TEST_CASE_NOT_FOUND.STATUS)
          .json({ error: TEST_CASE_NOT_FOUND.MESSAGE });
        return;
      }
      res.status(204).json(deletedTestCase);
    } catch (error) {
      res
        .status(TEST_CASE_DELETE_FAILED.STATUS)
        .json({ error: TEST_CASE_DELETE_FAILED.MESSAGE });
    }
  },
};
