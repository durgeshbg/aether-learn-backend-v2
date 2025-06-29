import { z } from 'zod';

export const LessonCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  courseId: z.string().min(1, 'Course ID is required'),
});

export const LessonUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  courseId: z.string().min(1, 'Course ID is required').optional(),
});

export const LessonIdParamsSchema = z.object({
  id: z.string().cuid('Invalid lesson ID format'),
});

export type LessonCreateType = z.infer<typeof LessonCreateSchema>;
export type LessonUpdateType = z.infer<typeof LessonUpdateSchema>;
