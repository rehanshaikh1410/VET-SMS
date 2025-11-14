export interface Quiz {
  id: string;
  title: string;
  description?: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  totalMarks: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'closed';
  questionCount: number;
  submissionCount?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  marks: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers: Array<{
    questionId: string;
    answer: string | number;
  }>;
  score?: number;
  totalMarks?: number;
  submittedAt: string;
  status: 'submitted' | 'graded';
  feedback?: string;
}

export interface StudentQuiz extends Quiz {
  submission?: QuizSubmission;
  questions?: QuizQuestion[];
}