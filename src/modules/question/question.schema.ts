import { z } from 'zod';

export const QuestionCreateSchema = z
  .object({
    text: z.string().min(1, 'Question cannot be empty'),
    options: z.array(z.string()).min(2, 'At least two options are required'),
    answer: z.number().int(),
  })
  .superRefine(
    (data: { options: string[]; answer: number }, ctx: z.RefinementCtx) => {
      if (data.answer < 0 || data.answer >= data.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answer'],
          message: `Invalid index of the options array (0 to ${
            data.options.length - 1
          })`,
        });
      }
    }
  );

export const QuestionUpdateSchema = z
  .object({
    text: z.string().min(1, 'Question cannot be empty').optional(),
    options: z
      .array(z.string())
      .min(2, 'At least two options are required')
      .optional(),
    answer: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.options === undefined && data.answer !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'required when answer is provided',
      });
    }

    if (data.options !== undefined && data.answer === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['answer'],
        message: 'required when options are provided',
      });
    }

    if (data.answer !== undefined && data.options !== undefined) {
      if (data.answer < 0 || data.answer >= (data.options?.length ?? 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answer'],
          message: `Invalid index of the options array (0 to ${
            data.options?.length - 1
          })`,
        });
      }
    }
  });

export const QuestionQuizCourseIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  quizId: z.string().cuid('Invalid quiz ID format'),
});

export const QuestionIdParamsSchema = z.object({
  courseId: z.string().cuid('Invalid course ID format'),
  quizId: z.string().cuid('Invalid quiz ID format'),
  id: z.string().cuid('Invalid question ID format'),
});

export type QuestionCreateType = z.infer<typeof QuestionCreateSchema>;
export type QuestionUpdateType = z.infer<typeof QuestionUpdateSchema>;
export type QuestionQuizCourseIdParamsType = z.infer<
  typeof QuestionQuizCourseIdParamsSchema
>;
export type QuestionIdParamsType = z.infer<typeof QuestionIdParamsSchema>;
