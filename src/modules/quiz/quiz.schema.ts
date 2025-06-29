import { z } from 'zod';

export const QuizCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required').optional(),
});

export const QuizUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
});

export const QuizIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  id: z.string().cuid('Invalid quiz ID format'),
});

export const QuizCourseIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
});

export type QuizCreateType = z.infer<typeof QuizCreateSchema>;
export type QuizUpdateType = z.infer<typeof QuizUpdateSchema>;
export type QuizIdParamsType = z.infer<typeof QuizIdParamsSchema>;
export type QuizCourseIdParamsType = z.infer<typeof QuizCourseIdParamsSchema>;
