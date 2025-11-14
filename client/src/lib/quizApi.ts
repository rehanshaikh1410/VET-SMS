import api from './api';
import { CreateQuizSchema, QuizSubmissionSchema } from '@shared/quizSchema';
import { z } from 'zod';

export const quizApi = {
  // Teacher endpoints
  createQuiz: async (data: z.infer<typeof CreateQuizSchema>) => {
    const response = await api.post('/quizzes', data);
    return response.data;
  },

  updateQuiz: async (id: string, data: Partial<z.infer<typeof CreateQuizSchema>>) => {
    const response = await api.put(`/quizzes/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id: string) => {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },

  getTeacherQuizzes: async () => {
    const response = await api.get('/quizzes/teacher');
    return response.data;
  },

  getQuizSubmissions: async (quizId: string) => {
    const response = await api.get(`/quizzes/${quizId}/submissions`);
    return response.data;
  },

  gradeQuizSubmission: async (submissionId: string, data: { score: number, feedback?: string }) => {
    const response = await api.put(`/quiz-submissions/${submissionId}/grade`, data);
    return response.data;
  },

  // Student endpoints
  getStudentQuizzes: async () => {
    const response = await api.get('/quizzes/student');
    return response.data;
  },

  getQuizById: async (id: string) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  submitQuiz: async (data: z.infer<typeof QuizSubmissionSchema>) => {
    const response = await api.post('/quiz-submissions', data);
    return response.data;
  },

  getStudentSubmissions: async () => {
    const response = await api.get('/quiz-submissions/student');
    return response.data;
  },

  getClassPerformanceAverage: async () => {
    const response = await api.get('/quiz-performance/class');
    return response.data;
  }
};