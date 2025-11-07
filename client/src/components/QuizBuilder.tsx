import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface QuizBuilderProps {
  onSubmit?: (data: any) => void;
}

export default function QuizBuilder({ onSubmit }: QuizBuilderProps) {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    duration: '',
    totalMarks: 0
  });

  const [questions, setQuestions] = useState<Question[]>([{
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 1
  }]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const data = { ...quizData, totalMarks, questions };
    onSubmit?.(data);
    console.log('Quiz created:', data);
  };

  return (
    <Card className="p-6" data-testid="quiz-builder">
      <h2 className="text-xl font-bold mb-6">Create Quiz</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              required
              data-testid="input-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={quizData.duration}
              onChange={(e) => setQuizData({ ...quizData, duration: e.target.value })}
              data-testid="input-duration"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId">Class *</Label>
            <Select value={quizData.classId} onValueChange={(val) => setQuizData({ ...quizData, classId: val })}>
              <SelectTrigger data-testid="select-class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class-1">Class 1</SelectItem>
                <SelectItem value="class-2">Class 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectId">Subject *</Label>
            <Select value={quizData.subjectId} onValueChange={(val) => setQuizData({ ...quizData, subjectId: val })}>
              <SelectTrigger data-testid="select-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={quizData.description}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
              data-testid="input-description"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Questions</h3>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion} data-testid="button-add-question">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <Card key={qIndex} className="p-4" data-testid={`question-${qIndex}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Question {qIndex + 1} *</Label>
                    <Textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      required
                      data-testid={`input-question-${qIndex}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                        className="w-20"
                        min="1"
                        data-testid={`input-marks-${qIndex}`}
                      />
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="mt-7"
                        data-testid={`button-remove-question-${qIndex}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Options *</Label>
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === optIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                        data-testid={`radio-correct-${qIndex}-${optIndex}`}
                      />
                      <Input
                        placeholder={`Option ${optIndex + 1}`}
                        value={option}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        required
                        data-testid={`input-option-${qIndex}-${optIndex}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Select the radio button for the correct answer</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" data-testid="button-submit-quiz">
            Create Quiz
          </Button>
        </div>
      </form>
    </Card>
  );
}
