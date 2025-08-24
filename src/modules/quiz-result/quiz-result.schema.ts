import { z } from 'zod';

export const QuizResultCreateSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().cuid().min(1, 'Question ID is required'),
      answer: z.number().min(0, 'Answer must be a non-negative number'),
    }),
  ),
});

export const QuizResultQuizIdParamsSchema = z.object({
  quizId: z.string().cuid().min(1, 'Quiz ID is required'),
  courseId: z.string().cuid().min(1, 'Course ID is required'),
});

export const QuizResultIdParamsSchema = z.object({
  id: z.string().cuid().min(1, 'Quiz Result ID is required'),
  quizId: z.string().cuid().min(1, 'Quiz ID is required'),
  courseId: z.string().cuid().min(1, 'Course ID is required'),
});

export type QuizResultCreateType = z.infer<typeof QuizResultCreateSchema>;
export type QuizResultQuizIdParamsType = z.infer<typeof QuizResultQuizIdParamsSchema>;
export type QuizResultIdParamsType = z.infer<typeof QuizResultIdParamsSchema>;
