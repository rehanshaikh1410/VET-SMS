import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QuizInterface from "@/components/QuizInterface";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText } from "lucide-react";
import { quizApi } from "@/lib/quizApi";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

import { StudentQuiz, QuizSubmission } from '@shared/types';

export default function StudentQuizzes() {
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuiz | null>(null);
  const [viewingResults, setViewingResults] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quizzes = [], isLoading } = useQuery<StudentQuiz[]>({
    queryKey: ['studentQuizzes'],
    queryFn: quizApi.getStudentQuizzes
  });

  // Check if we need to auto-load a quiz from grades view
  useEffect(() => {
    const storedQuizId = sessionStorage.getItem('viewQuizResultId');
    if (storedQuizId) {
      sessionStorage.removeItem('viewQuizResultId');
      handleViewResults(storedQuizId);
    }
  }, []);

  const submitQuizMutation = useMutation({
    mutationFn: quizApi.submitQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions'] });
      toast({ title: "Success", description: "Quiz submitted successfully" });
      setSelectedQuiz(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to submit quiz. Please try again.';
      toast({ 
        title: "Error", 
        description: message, 
        variant: "destructive" 
      });
    }
  });

  const sampleQuestions = [
    {
      id: '1',
      question: 'What is the value of x in the equation 2x + 5 = 15?',
      options: ['3', '5', '7', '10'],
      correctAnswer: 1
    },
    {
      id: '2',
      question: 'Which of the following is a prime number?',
      options: ['12', '15', '17', '20'],
      correctAnswer: 2
    },
    {
      id: '3',
      question: 'What is 25% of 80?',
      options: ['15', '20', '25', '30'],
      correctAnswer: 1
    }
  ];

  const handleStart = async (quizId: string) => {
    try {
      const detail = await quizApi.getQuizById(quizId);
      // detail should include questions array
      setSelectedQuiz(detail);
      setViewingResults(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load quiz details', variant: 'destructive' });
    }
  };

  const handleViewResults = async (quizId: string) => {
    try {
      const detail = await quizApi.getQuizById(quizId);
      setSelectedQuiz(detail);
      setViewingResults(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load quiz results', variant: 'destructive' });
    }
  };

  const [justSubmittedIds, setJustSubmittedIds] = useState<string[]>([]);

  if (selectedQuiz) {
    return (
      <div className="space-y-6" data-testid="student-quiz-attempt">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => {
            setSelectedQuiz(null);
            setViewingResults(false);
          }} data-testid="button-back">
            ← Back to Quizzes
          </Button>
          {viewingResults && (
            <p className="text-muted-foreground">Viewing Results</p>
          )}
        </div>
        {!viewingResults ? (
          <QuizInterface
            title={selectedQuiz.title}
            questions={(selectedQuiz as any).questions || sampleQuestions}
            onSubmitAsync={async (answers: any[]) => {
              // Server will derive studentId from the authenticated user token; send quizId + answers array (positional)
              const quizId = (selectedQuiz as any)._id || (selectedQuiz as any).id;
              // Ensure answers array length matches questions length and pad with -1 for unanswered
              const qCount = ((selectedQuiz as any).questions || sampleQuestions).length;
              const normalized = Array.from({ length: qCount }, (_v, i) => typeof answers[i] === 'number' ? answers[i] : -1);

              try {
                // Build answers as array of objects { questionId, answer } to match server schema
                const qList = (selectedQuiz as any).questions || sampleQuestions;
                const answersPayload = normalized.map((ans, idx) => ({
                  questionId: qList[idx]?.id ?? qList[idx]?._id ?? String(idx),
                  answer: ans
                }));

                const submission = await submitQuizMutation.mutateAsync({ quizId, answers: answersPayload } as any);
                // Optimistically mark this quiz as submitted so Start is disabled immediately
                setJustSubmittedIds(prev => Array.from(new Set([...prev, quizId])));
                // return score/total so the QuizInterface can display server-validated score
                return { score: submission.score, totalMarks: submission.totalMarks };
              } catch (err) {
                // error handled by mutation onError
                throw err;
              }
            }}
          />
        ) : (
          <Card className="p-6 max-w-2xl mx-auto" data-testid="quiz-results-view">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Quiz Results - {selectedQuiz.title}</h2>
              {selectedQuiz.submission && selectedQuiz.submission.score !== undefined && selectedQuiz.submission.totalMarks !== undefined ? (
                <>
                  <div className="text-6xl font-bold text-primary" data-testid="quiz-score">
                    {selectedQuiz.submission.score}/{selectedQuiz.submission.totalMarks}
                  </div>
                  <p className="text-muted-foreground">
                    You scored {Math.round((selectedQuiz.submission.score / selectedQuiz.submission.totalMarks) * 100)}%
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Questions</p>
                      <p className="font-semibold">{(selectedQuiz as any).questions?.length ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-semibold">{selectedQuiz.submission.submittedAt ? new Date(selectedQuiz.submission.submittedAt).toLocaleDateString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold text-green-600">Completed</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-lg">No submission found for this quiz</p>
                  <Button onClick={() => {
                    setSelectedQuiz(null);
                    setViewingResults(false);
                  }}>
                    Back to Quizzes
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="student-quizzes-page">
      <div>
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <p className="text-muted-foreground mt-1">View and attempt your assigned quizzes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const id = (quiz as any)._id || (quiz as any).id;
          return (
          <Card key={id} className="p-6 space-y-4" data-testid={`quiz-card-${id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground">{quiz.subjectName || quiz.subjectId}</p>
              </div>
              <Badge variant={quiz.status === 'published' ? 'default' : 'outline'}>
                {quiz.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{quiz.questionCount ?? '—'} questions • {quiz.totalMarks ?? '—'} marks</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{quiz.duration} minutes</span>
              </div>
              <div className="text-muted-foreground">
                Deadline: {quiz.endDate ? new Date(quiz.endDate).toLocaleString() : quiz.endDate}
              </div>
              {quiz.submission && (
                <div className="font-semibold text-primary">
                  Score: {quiz.submission.score ?? '—'}/{quiz.totalMarks}
                </div>
              )}
            </div>

            { (quiz.status === 'published' && !justSubmittedIds.includes(id)) ? (
              <Button 
                className="w-full" 
                onClick={() => handleStart(id)}
                data-testid={`button-start-quiz-${id}`}
              >
                Start Quiz
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleViewResults(id)}
                data-testid={`button-view-results-${id}`}
              >
                View Results
              </Button>
            )}
          </Card>
        );
        })}
      </div>
    </div>
  );
}
