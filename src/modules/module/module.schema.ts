import { z } from 'zod';
import { DifficultyLevel } from '../../generated/prisma';

export const ModuleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  code: z.string().optional(),
  languageId: z.number().int().positive('Language ID must be a positive integer'),
  objectives: z.array(z.string()).optional(),
  durationMinutes: z.number().int().positive('Duration must be a positive integer').optional(),
  difficulty: z.enum(
    [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED],
    {
      required_error: 'Difficulty level is required',
      invalid_type_error: 'Invalid difficulty level',
    },
  ),
});

export const ModuleUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  code: z.string().optional(),
  languageId: z.number().int().positive('Language ID must be a positive integer').optional(),
  objectives: z.array(z.string()).optional(),
  durationMinutes: z.number().int().positive('Duration must be a positive integer').optional(),
  difficulty: z
    .enum([DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED], {
      invalid_type_error: 'Invalid difficulty level',
    })
    .optional(),
});

export const CourseLessonModuleIdParamSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  lessonId: z.string().cuid('Invalid lesson ID format'),
});

export const ModuleIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  lessonId: z.string().cuid('Invalid lesson ID format'),
  id: z.string().cuid('Invalid module ID format'),
});

export type ModuleCreateType = z.infer<typeof ModuleCreateSchema>;
export type ModuleUpdateType = z.infer<typeof ModuleUpdateSchema>;
export type ModuleIdParamsType = z.infer<typeof ModuleIdParamsSchema>;
export type CourseLessonModuleIdParamsType = z.infer<typeof CourseLessonModuleIdParamSchema>;
