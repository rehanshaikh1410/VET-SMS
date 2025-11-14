import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  marks: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  classId: { type: String, required: true },
  subjectId: { type: String, required: true },
  duration: { type: Number },
  totalMarks: { type: Number, required: true },
  questions: [questionSchema],
  // createdBy is optional to allow quizzes created from admin UI without auth
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;