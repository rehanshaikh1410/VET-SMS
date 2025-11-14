import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const teacherAssignments = pgTable("teacher_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  classId: varchar("class_id").notNull(),
});

export const studentRecords = pgTable("student_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  rollNumber: text("roll_number").notNull(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(),
  markedBy: varchar("marked_by").notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  totalMarks: integer("total_marks").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  marks: integer("marks").notNull(),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  studentId: varchar("student_id").notNull(),
  score: integer("score").notNull(),
  totalMarks: integer("total_marks").notNull(),
  answers: text("answers").array().notNull(),
  submittedAt: timestamp("submitted_at").notNull(),
});

export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  postedBy: varchar("posted_by").notNull(),
  targetRole: text("target_role"),
  priority: text("priority").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const timetables = pgTable("timetables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  period: integer("period").notNull(),
  subjectId: varchar("subject_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

// <-- add this block in schema.ts (below other table defs)
export const todos = pgTable("todos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTodoSchema = createInsertSchema(todos).omit({ id: true, createdAt: true, updatedAt: true });
export type Todo = typeof todos.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertNoticeSchema = createInsertSchema(notices).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type StudentRecord = typeof studentRecords.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type Timetable = typeof timetables.$inferSelect;
