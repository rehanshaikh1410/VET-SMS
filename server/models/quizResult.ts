import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    marks: { type: Number, required: true }
  }],
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuizResult', quizResultSchema);