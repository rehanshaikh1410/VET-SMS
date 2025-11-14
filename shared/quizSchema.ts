import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

// Quiz schema
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  totalMarks: integer("total_marks").notNull(),
  duration: integer("duration").notNull(), // in minutes
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  questions: jsonb("questions").notNull(),
  status: text("status").notNull().default('draft'), // draft, published, closed
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`),
});

// Quiz submissions schema
export const quizSubmissions = pgTable("quiz_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  studentId: varchar("student_id").notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score"),
  submittedAt: timestamp("submitted_at").notNull().default(sql`NOW()`),
  status: text("status").notNull(), // submitted, graded
  feedback: text("feedback"),
});

// Zod schema for quiz validation
export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(['multiple-choice', 'short-answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]),
  marks: z.number(),
});

export const CreateQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  classId: z.string(),
  subjectId: z.string(),
  totalMarks: z.number().positive(),
  duration: z.number().positive(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  questions: z.array(QuizQuestionSchema),
});

export const QuizSubmissionSchema = z.object({
  quizId: z.string(),
  studentId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.number()]),
  })),
});