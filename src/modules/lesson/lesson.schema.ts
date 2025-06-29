import { z } from 'zod';

export const LessonCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export const LessonUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
});

export const LessonIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  id: z.string().cuid('Invalid lesson ID format'),
});

export const LessonCourseIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
});

export type LessonCreateType = z.infer<typeof LessonCreateSchema>;
export type LessonUpdateType = z.infer<typeof LessonUpdateSchema>;
export type LessonIdParamsType = z.infer<typeof LessonIdParamsSchema>;
export type LessonCourseIdParamsType = z.infer<typeof LessonCourseIdParamsSchema>;
