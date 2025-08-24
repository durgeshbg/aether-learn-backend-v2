import { z } from 'zod';

export const CodeAssessmentCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  starterCode: z.string().min(1, 'Starter code is required'),
  languageId: z.number().int().positive('Language ID must be a positive integer'),
});

export const CodeAssessmentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  instructions: z.string().min(1, 'Instructions are required').optional(),
  starterCode: z.string().min(1, 'Starter code is required').optional(),
  languageId: z.number().int().positive('Language ID must be a positive integer').optional(),
});

export const CodeAssessmentIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  id: z.string().cuid('Invalid code assessment ID format'),
});

export const CodeAssessmentCourseIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
});

export type CodeAssessmentCreateType = z.infer<typeof CodeAssessmentCreateSchema>;
export type CodeAssessmentUpdateType = z.infer<typeof CodeAssessmentUpdateSchema>;
export type CodeAssessmentIdParamsType = z.infer<typeof CodeAssessmentIdParamsSchema>;
export type CodeAssessmentCourseIdParamsType = z.infer<typeof CodeAssessmentCourseIdParamsSchema>;
