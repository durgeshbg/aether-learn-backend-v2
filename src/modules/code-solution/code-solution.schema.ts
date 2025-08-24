import { z } from 'zod';
import { CodeSolutionStatus } from '../../generated/prisma';

export const CodeSolutionCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export const CodeSolutionStatusUpdateSchema = z.object({
  status: z.enum([CodeSolutionStatus.GRADED, CodeSolutionStatus.SUBMITTED], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

export const CodeSolutionScoreUpdateSchema = z.object({
  score: z
    .number()
    .min(0, 'Score must be a non-negative number')
    .max(100, 'Score must be at most 100'),
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

export type CodeSolutionCreateType = z.infer<typeof CodeSolutionCreateSchema>;
export type CodeSolutionStatusUpdateType = z.infer<typeof CodeSolutionStatusUpdateSchema>;
export type CodeSolutionScoreUpdateType = z.infer<typeof CodeSolutionScoreUpdateSchema>;
export type CodeSolutionAssesmentIdParamType = z.infer<typeof CodeSolutionAssesmentIdParamSchema>;
export type CodeSolutionIdParamType = z.infer<typeof CodeSolutionIdParamSchema>;
