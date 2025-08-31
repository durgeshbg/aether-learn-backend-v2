import { z } from 'zod';
import { DifficultyLevel } from '../../generated/prisma';

export const LessonCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  difficulty: z.enum(
    [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED],
    {
      required_error: 'Difficulty level is required',
      invalid_type_error: 'Invalid difficulty level',
    },
  ),
  objectives: z.array(z.string()).optional(),
});

export const LessonUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  difficulty: z
    .enum([DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED], {
      invalid_type_error: 'Invalid difficulty level',
    })
    .optional(),
  objectives: z.array(z.string()).optional(),
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
