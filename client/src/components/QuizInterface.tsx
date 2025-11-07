import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizInterfaceProps {
  title: string;
  questions: Question[];
  onSubmit?: (answers: number[]) => void;
}

export default function QuizInterface({ title, questions, onSubmit }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.(answers);
    console.log('Quiz submitted with answers:', answers);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const score = submitted ? answers.reduce((acc, answer, idx) => 
    answer === questions[idx].correctAnswer ? acc + 1 : acc, 0) : 0;

  if (submitted) {
    return (
      <Card className="p-6 max-w-2xl mx-auto" data-testid="quiz-results">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Quiz Completed!</h2>
          <div className="text-6xl font-bold text-primary" data-testid="quiz-score">{score}/{questions.length}</div>
          <p className="text-muted-foreground">You scored {Math.round((score/questions.length) * 100)}%</p>
          
          <div className="space-y-4 mt-8 text-left">
            {questions.map((q, idx) => (
              <Card key={q.id} className={`p-4 ${answers[idx] === q.correctAnswer ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold">Q{idx + 1}: {q.question}</p>
                  {answers[idx] === q.correctAnswer ? (
                    <Badge className="bg-green-500">Correct</Badge>
                  ) : (
                    <Badge variant="destructive">Incorrect</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Your answer: {q.options[answers[idx]] || 'Not answered'}</p>
                {answers[idx] !== q.correctAnswer && (
                  <p className="text-sm text-green-600 mt-1">Correct answer: {q.options[q.correctAnswer]}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto space-y-4" data-testid="quiz-interface">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <Badge variant="outline" data-testid="question-number">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />

          <div className="mt-6">
            <p className="text-lg font-semibold mb-4" data-testid="current-question">{question.question}</p>
            
            <RadioGroup value={answers[currentQuestion]?.toString()} onValueChange={(val) => handleAnswer(parseInt(val))}>
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-3 border rounded-md p-4 hover-elevate ${
                      answers[currentQuestion] === idx ? 'border-primary bg-primary/5' : ''
                    }`}
                    data-testid={`option-${idx}`}
                  >
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              data-testid="button-previous"
            >
              Previous
            </Button>
            
            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={answers.includes(-1)}
                data-testid="button-submit-quiz"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="button-next"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
