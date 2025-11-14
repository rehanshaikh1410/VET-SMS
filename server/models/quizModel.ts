import mongoose from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface IQuiz {
  title: string;
  description?: string;
  // Support multiple classes for a quiz
  classIds: string[];
  subjectId: string;
  duration?: number;
  totalMarks: number;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const questionSchema = new mongoose.Schema<IQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  marks: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema<IQuiz>({
  title: { type: String, required: true },
  description: { type: String },
  // store multiple class ids; keep required for now to ensure quiz targets at least one class
  classIds: { type: [String], required: true },
  subjectId: { type: String, required: true },
  duration: { type: Number },
  totalMarks: { type: Number, required: true },
  questions: [questionSchema],
  // createdBy is optional so quizzes can be created by admin UI without auth during dev
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;