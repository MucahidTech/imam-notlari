import { z } from 'zod';
import { categorySlugSchema } from './category';

// Quiz modes supported by the app.
export const QUIZ_TYPES = ['kisa', 'tam', 'konu'] as const;
export const quizTypeSchema = z.enum(QUIZ_TYPES);
export type QuizType = z.infer<typeof quizTypeSchema>;

// A single multiple-choice question.
export const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().nonnegative(),
});

export type Question = z.infer<typeof questionSchema>;

// Quiz summary shown in lists (no questions payload).
export const quizSummarySchema = z.object({
  id: z.string(),
  type: quizTypeSchema,
  categorySlug: categorySlugSchema.optional(),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  questionCount: z.number().int().positive(),
});

export type QuizSummary = z.infer<typeof quizSummarySchema>;

// Full quiz payload used during an exam session.
export const quizDetailSchema = quizSummarySchema.extend({
  questions: z.array(questionSchema).min(1),
});

export type QuizDetail = z.infer<typeof quizDetailSchema>;

// User's answer for a single question.
export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null; // null = blank
}

// Per-question result status used in the review screen.
export type AnswerStatus = 'correct' | 'wrong' | 'blank';
