import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { CreateQuizSchema } from "@shared/quizSchema";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface QuizBuilderProps {
  onSubmit?: (data: any) => void;
  initialData?: any;
  onCancel?: () => void;
}

export default function QuizBuilder({ onSubmit, initialData, onCancel }: QuizBuilderProps) {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    // support multiple classes
    classIds: [] as string[],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // sanitize questions: ensure marks are numbers and options non-empty
      const sanitizedQuestions = questions.map((q) => ({
        question: (q.question || '').toString(),
        options: (Array.isArray(q.options) ? q.options : ['', '', '', '']).map((o) => (o || '').toString()),
        correctAnswer: Number.isFinite(Number(q.correctAnswer)) ? Number(q.correctAnswer) : 0,
        marks: Number.isFinite(Number(q.marks)) && Number(q.marks) > 0 ? Number(q.marks) : 1,
      }));

      // basic validation
      if (!quizData.title || String(quizData.title).trim() === '') {
        alert('Title is required');
        return;
      }
      if (!Array.isArray(quizData.classIds) || quizData.classIds.length === 0) {
        alert('Please select at least one class');
        return;
      }
      if (!quizData.subjectId || String(quizData.subjectId).trim() === '') {
        alert('Please select a subject');
        return;
      }
      if (!Array.isArray(sanitizedQuestions) || sanitizedQuestions.length === 0) {
        alert('Add at least one question');
        return;
      }
      // ensure each question has text and 4 options
        for (let i = 0; i < sanitizedQuestions.length; i++) {
          const sq = sanitizedQuestions[i];
          if (!sq.question || String(sq.question).trim() === '') {
            alert(`Question ${i + 1} must have text`);
            return;
          }
        if (!Array.isArray(sq.options) || sq.options.length < 2) {
          alert(`Question ${i + 1} must have options`);
          return;
        }
        if (sq.options.some((opt) => String(opt).trim() === '')) {
          alert(`All options for question ${i + 1} must be filled`);
          return;
        }
        if (!Number.isFinite(sq.correctAnswer) || sq.correctAnswer < 0 || sq.correctAnswer >= sq.options.length) {
          // clamp to 0
          sq.correctAnswer = 0;
        }
      }

      const totalMarks = sanitizedQuestions.reduce((sum, q) => sum + q.marks, 0);
      const data = { ...quizData, totalMarks, questions: sanitizedQuestions } as any;

      // createdBy removed from form; backend will use authenticated user as creator

      // Convert duration to number if provided
      if (data.duration !== undefined && data.duration !== '') {
        const n = Number(data.duration);
        if (!Number.isNaN(n)) data.duration = n;
      } else {
        delete data.duration;
      }

      // Delegate persistence to parent
      onSubmit?.(data);
      console.log('Quiz submit payload prepared:', data);
    } catch (error) {
      console.error('Error creating/updating quiz:', error);
    }
  };

  // Load classes and subjects to populate selects. We'll filter classes to the
  // currently logged-in teacher's classes and filter subjects by selected class.
  const [classesAll, setClassesAll] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]); // filtered to teacher
  const [subjectsAll, setSubjectsAll] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]); // filtered by class
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async function load() {
      try {
        // Use axios instance so Authorization header (token) is sent
        const [uRes, cRes, sRes] = await Promise.all([
          api.get('/me'),
          api.get('/classes'),
          api.get('/subjects')
        ]);

        if (uRes && uRes.data) setCurrentUser(uRes.data);
        if (cRes && cRes.data) setClassesAll(cRes.data);
        if (sRes && sRes.data) setSubjectsAll(sRes.data);
      } catch (err) {
        console.error('Failed to load classes/subjects for quiz builder', err);
      }
    })();
  }, []);

  // When currentUser or classesAll changes, filter classes for teacher role
  useEffect(() => {
    if (!currentUser || !Array.isArray(classesAll)) return;
    if (currentUser.role === 'teacher') {
      const filtered = classesAll.filter((c: any) => {
        const ct = c.classTeacher;
        // ct may be a string id, an ObjectId-like, or a populated object with _id
        let ctId = '';
        if (!ct) return false;
        if (typeof ct === 'string') ctId = ct;
        else if (ct && (ct._id || ct.id)) ctId = (ct._id || ct.id).toString();
        else ctId = ct.toString();
        return ctId === String(currentUser._id);
      });
      setClasses(filtered);
    } else {
      // non-teachers (admin) see all classes
      setClasses(classesAll);
    }
  }, [currentUser, classesAll]);

  // When class selection changes or subjectsAll loaded, filter subjects assigned to current teacher or to the selected classes
  useEffect(() => {
    if (!Array.isArray(subjectsAll)) {
      setSubjects([]);
      return;
    }
    
    let filtered = subjectsAll;
    
    // If user is a teacher, filter by subjects they teach
    if (currentUser?.role === 'teacher' && currentUser?._id) {
      filtered = filtered.filter((s: any) => {
        if (!s.teachers) return false;
        const teacherIds = s.teachers.map((t: any) => (t._id || t).toString());
        return teacherIds.includes(String(currentUser._id));
      });
    }
    
    // If classes are selected, further filter by class assignment (for subjects that have class assignments)
    if (Array.isArray(quizData.classIds) && quizData.classIds.length > 0 && filtered.length > 0) {
      const classIdsSet = new Set(quizData.classIds.map((id) => id.toString()));
      const classFiltered = filtered.filter((s: any) => {
        if (!Array.isArray(s.classes) || s.classes.length === 0) return true; // include subjects with no class restriction
        return s.classes.map((c: any) => (c._id || c).toString()).some((cid: string) => classIdsSet.has(cid));
      });
      // Only use class filter if it returns results, otherwise keep previous filtered
      if (classFiltered.length > 0) {
        filtered = classFiltered;
      }
    }
    
    setSubjects(filtered);
    // if selected subject is not in filtered list, clear it
    if (quizData.subjectId && !filtered.some((fs: any) => (fs._id || fs).toString() === quizData.subjectId)) {
      setQuizData({ ...quizData, subjectId: '' });
    }
  }, [quizData.classIds, subjectsAll, currentUser]);

  // Apply initial data when editing
  useEffect(() => {
    if (!initialData) return;
    try {
      console.log('Initializing quiz data:', initialData);
      
      // Set basic quiz data
      setQuizData({
        title: initialData.title || '',
        description: initialData.description || '',
        // support legacy single classId or new classIds array
        classIds: Array.isArray(initialData.classIds) ? initialData.classIds : (initialData.classId ? [initialData.classId] : []),
        subjectId: initialData.subjectId || '',
        duration: initialData.duration ? String(initialData.duration) : '',
        totalMarks: initialData.totalMarks || 0,
      });

      // Set questions if they exist
      if (Array.isArray(initialData.questions) && initialData.questions.length > 0) {
        const formattedQuestions = initialData.questions.map((q: any) => ({
          question: q.question || '',
          options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          marks: typeof q.marks === 'number' ? q.marks : 1,
        }));
        console.log('Setting questions:', formattedQuestions);
        setQuestions(formattedQuestions);
      }
    } catch (err) {
      console.error('Failed to apply initial quiz data', err);
    }
  }, [initialData]);

  return (
    <Card className="p-6 flex flex-col" data-testid="quiz-builder">
      <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit Quiz' : 'Create Quiz'}</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
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
            <Label htmlFor="classIds">Classes *</Label>
            <div className="border rounded max-h-40 overflow-y-auto p-2 bg-white">
              {classes.map((c) => (
                <label key={c._id || c.id} className="flex items-center gap-3 py-1 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={Array.isArray(quizData.classIds) && quizData.classIds.includes(c._id || c.id)}
                    onChange={(e) => {
                      const id = (c._id || c.id).toString();
                      const current = Array.isArray(quizData.classIds) ? [...quizData.classIds] : [];
                      if (e.target.checked) {
                        if (!current.includes(id)) current.push(id);
                      } else {
                        const idx = current.indexOf(id);
                        if (idx >= 0) current.splice(idx, 1);
                      }
                      setQuizData({ ...quizData, classIds: current });
                    }}
                    data-testid="checkbox-class"
                  />
                  <span className="text-sm">{c.name}{c.grade ? ` - ${c.grade}` : ''}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectId">Subject *</Label>
            <Select value={quizData.subjectId} onValueChange={(val) => setQuizData({ ...quizData, subjectId: val })}>
              <SelectTrigger data-testid="select-subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.name}</SelectItem>
                ))}
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
          <h3 className="font-semibold">Questions</h3>

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

        </div>

        <div className="flex gap-2 justify-center">
          <Button type="button" variant="outline" onClick={addQuestion} data-testid="button-add-question" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        <div className="sticky bottom-0 left-0 right-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            data-testid="button-cancel" 
            onClick={() => onCancel?.()}
          >
            Cancel
          </Button>
          <Button type="submit" data-testid="button-submit-quiz">
            {initialData ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
