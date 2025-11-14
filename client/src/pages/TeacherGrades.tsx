import DataTable, { Column } from "@/components/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { quizApi } from "@/lib/quizApi";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function TeacherGrades() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Load classes available to the teacher
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const res = await api.get('/classes');
        return res.data || [];
      } catch (err) {
        console.error('Failed to load classes', err);
        return [];
      }
    }
  });

  // Load quizzes created by this teacher
  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: async () => {
      try {
        return await quizApi.getTeacherQuizzes();
      } catch (err) {
        console.error('Failed to load teacher quizzes', err);
        return [];
      }
    }
  });

  // Filter quizzes to only those assigned to the selected class
  const filteredQuizzes = selectedClass
    ? allQuizzes.filter((q: any) => {
        // Quiz can have classIds array or legacy classId
        const quizClassIds = Array.isArray(q.classIds) ? q.classIds : (q.classId ? [q.classId] : []);
        return quizClassIds.some((cid: any) => String(cid) === String(selectedClass));
      })
    : [];

  const columns: Column[] = [
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'name', label: 'Student Name' },
    { key: 'score', label: 'Score' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'grade', label: 'Grade' },
  ];

  // Selected quiz submissions (per-student)
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['quizSubmissions', selectedQuiz],
    queryFn: async () => {
      if (!selectedQuiz) {
        console.log('No quiz selected, returning empty array');
        return [];
      }
      try {
        // Call the server endpoint that returns per-quiz submissions with student info
        const res = await api.get(`/quiz-submissions/quiz/${selectedQuiz}`);
        console.log('Submissions loaded for quiz', selectedQuiz, ':', res.data);
        return res.data || [];
      } catch (err) {
        console.warn('Could not load quiz submissions for', selectedQuiz, err);
        return [];
      }
    },
    enabled: !!selectedQuiz
  });

  // Map submissions into DataTable rows - filter by selected class
  const submissionsArray = Array.isArray(submissions) ? submissions : [];
  
  // Filter to selected class only
  const filteredSubmissions = submissionsArray.filter((s: any) => {
    if (!selectedClass) return false;
    const student = s.student || {};
    if (student && typeof student === 'object' && student.classId) {
      return String(student.classId) === String(selectedClass);
    }
    return false;
  });

  const dataRows = filteredSubmissions.map((s: any) => {
    const student = s.student || {};
    const score = typeof s.score === 'number' ? s.score : (s.score ? Number(s.score) : 0);
    const totalMarks = typeof s.totalMarks === 'number' ? s.totalMarks : (s.totalMarks ? Number(s.totalMarks) : 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    
    let grade = 'N/A';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    else if (percentage >= 0) grade = 'F';

    return {
      _id: s._id,
      rollNumber: student.rollNumber || '',
      name: student.name || '',
      score,
      totalMarks,
      percentage,
      grade,
    };
  });

  return (
    <div className="space-y-6" data-testid="teacher-grades-page">
      <div>
        <h1 className="text-3xl font-bold">Student Grades</h1>
        <p className="text-muted-foreground mt-1">View and analyze student performance</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="w-64 space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger data-testid="select-class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
              {!classesLoading && (classes.length === 0) && <SelectItem value="__none" disabled>No classes found</SelectItem>}
              {!classesLoading && classes.map((cls: any) => (
                <SelectItem key={cls._id} value={String(cls._id)}>
                  {cls.name}{cls.grade ? ` (Div ${cls.grade})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64 space-y-2">
          <Label>Select Quiz</Label>
          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger data-testid="select-quiz">
              <SelectValue placeholder="Select a quiz" />
            </SelectTrigger>
            <SelectContent>
              {!selectedClass && <SelectItem value="__select_class" disabled>Select a class first</SelectItem>}
              {selectedClass && quizzesLoading && <SelectItem value="__loading_quiz" disabled>Loading quizzes...</SelectItem>}
              {selectedClass && !quizzesLoading && filteredQuizzes.length === 0 && <SelectItem value="__none_quiz" disabled>No quizzes for this class</SelectItem>}
              {selectedClass && !quizzesLoading && filteredQuizzes.length > 0 && filteredQuizzes.map((q: any) => (
                <SelectItem key={q._id} value={String(q._id)}>
                  {q.title || q.name || `Quiz ${q._id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={dataRows}
        onView={(row) => setSelectedStudent(row)}
      />

      {selectedClass && selectedQuiz && dataRows.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          No students have submitted this quiz yet.
        </Card>
      )}

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Quiz Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
                  <p className="text-lg font-semibold">{selectedStudent.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                  <p className="text-lg font-semibold">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <p className="text-lg font-semibold">{selectedStudent.score}/{selectedStudent.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Percentage</p>
                  <p className="text-lg font-semibold">{selectedStudent.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  <p className="text-lg font-semibold">{selectedStudent.grade}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
