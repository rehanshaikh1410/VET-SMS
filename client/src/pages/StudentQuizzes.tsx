import { useState } from "react";
import QuizInterface from "@/components/QuizInterface";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText } from "lucide-react";

export default function StudentQuizzes() {
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const quizzes = [
    {
      id: '1',
      title: 'Mathematics - Algebra Basics',
      subject: 'Mathematics',
      duration: 30,
      totalQuestions: 10,
      totalMarks: 20,
      status: 'pending',
      deadline: '2024-12-15'
    },
    {
      id: '2',
      title: 'Physics - Motion and Forces',
      subject: 'Physics',
      duration: 45,
      totalQuestions: 15,
      totalMarks: 30,
      status: 'pending',
      deadline: '2024-12-16'
    },
    {
      id: '3',
      title: 'English - Grammar Test',
      subject: 'English',
      duration: 20,
      totalQuestions: 8,
      totalMarks: 16,
      status: 'completed',
      score: 14,
      deadline: '2024-12-10'
    }
  ];

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

  if (selectedQuiz) {
    return (
      <div className="space-y-6" data-testid="student-quiz-attempt">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedQuiz(null)} data-testid="button-back">
            ← Back to Quizzes
          </Button>
        </div>
        <QuizInterface
          title={selectedQuiz.title}
          questions={sampleQuestions}
          onSubmit={() => setSelectedQuiz(null)}
        />
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
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="p-6 space-y-4" data-testid={`quiz-card-${quiz.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground">{quiz.subject}</p>
              </div>
              <Badge variant={quiz.status === 'pending' ? 'default' : 'outline'}>
                {quiz.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{quiz.totalQuestions} questions • {quiz.totalMarks} marks</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{quiz.duration} minutes</span>
              </div>
              <div className="text-muted-foreground">
                Deadline: {quiz.deadline}
              </div>
              {quiz.status === 'completed' && (
                <div className="font-semibold text-primary">
                  Score: {quiz.score}/{quiz.totalMarks}
                </div>
              )}
            </div>

            {quiz.status === 'pending' ? (
              <Button 
                className="w-full" 
                onClick={() => setSelectedQuiz(quiz)}
                data-testid={`button-start-quiz-${quiz.id}`}
              >
                Start Quiz
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('View results:', quiz)}
                data-testid={`button-view-results-${quiz.id}`}
              >
                View Results
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
