import { z } from 'zod';

export const CodeSolutionCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export const CodeSolutionAssesmentIdParamSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  codeAssessmentId: z.string().cuid('Invalid code assessment ID format'),
});

export const CodeSolutionIdParamSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  codeAssessmentId: z.string().cuid('Invalid code solution ID format'),
  id: z.string().cuid('Invalid code assessment ID format'),
});

export const CodeSolutionIdAndTestCaseIdParamSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  codeAssessmentId: z.string().cuid('Invalid code assessment ID format'),
  codeSolutionId: z.string().cuid('Invalid code solution ID format'),
  testCaseId: z.string().cuid('Invalid test case ID format'),
  judge0AuthToken: z.string(),
});

export const Judge0SubmissionSchema = z.object({
  stdout: z.string().nullable(),
  time: z.string().nullable(),
  memory: z.number().nullable(),
  stderr: z.string().nullable(),
  token: z.string(),
  compile_output: z.string().nullable(),
  message: z.string().nullable(),
  status: z.object({
    id: z.number(),
    description: z.string(),
  }),
});

export type CodeSolutionCreateType = z.infer<typeof CodeSolutionCreateSchema>;
export type CodeSolutionAssesmentIdParamType = z.infer<typeof CodeSolutionAssesmentIdParamSchema>;
export type CodeSolutionIdParamType = z.infer<typeof CodeSolutionIdParamSchema>;
export type Judge0SubmissionType = z.infer<typeof Judge0SubmissionSchema>;
export type CodeSolutionIdAndTestCaseIdParamType = z.infer<
  typeof CodeSolutionIdAndTestCaseIdParamSchema
>;
