import { useEffect, useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import QuizBuilder from "@/components/QuizBuilder";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { useWebSocket } from '@/hooks/use-websocket';

export default function AdminQuizzes() {
  const [showForm, setShowForm] = useState(false);
  const [editQuiz, setEditQuiz] = useState<any | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<any | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const loadQuizzes = async () => {
    try {
      const [quizData, classData, subjectData] = await Promise.all([
        api.get('/quizzes').then(res => res.data),
        api.get('/classes').then(res => res.data),
        api.get('/subjects').then(res => res.data)
      ]);
      setQuizzes(quizData);
      setClasses(classData);
      setSubjects(subjectData);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    }
  };

  useEffect(() => {
    // Load all required data
    Promise.all([
      api.get('/quizzes').then(res => res.data),
      api.get('/classes').then(res => res.data),
      api.get('/subjects').then(res => res.data)
    ]).then(([quizData, classData, subjectData]) => {
      setQuizzes(quizData);
      setClasses(classData);
      setSubjects(subjectData);
    }).catch(err => {
      console.error('Error loading quiz data:', err);
    });
  }, []);

  // refresh when quizzes are created/submitted elsewhere
  useWebSocket(
    undefined,
    undefined,
    (quizUpdate) => {
      // re-load quizzes when a quiz-related event happens
      loadQuizzes();
    },
    undefined
  );

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'subject', label: 'Subject' },
    { key: 'classes', label: 'Classes' },
    { key: 'questions', label: 'Questions' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'status', label: 'Status' }
  ];

  const data = quizzes.map((q) => ({ 
    id: q._id, 
    title: q.title, 
    // Support multiple classIds or legacy single classId
    classes: Array.isArray(q.classIds) 
      ? q.classIds.map((classId: any) => {
          const cls = classes.find((c: any) => c._id === classId);
          return `${cls?.name || classId}${cls?.grade ? ` - ${cls.grade}` : ''}`;
        }).join(', ')
      : classes.find((c: any) => c._id === q.classId)?.name || q.classId || '-',
    subject: subjects.find(s => s._id === q.subjectId)?.name || q.subjectId || '-', 
    questions: q.questions?.length || 0, 
    totalMarks: q.totalMarks || 0, 
    createdBy: q.createdBy?.name || '-', 
    status: q.status || 'Active' 
  }));

  return (
    <div className="space-y-6" data-testid="admin-quizzes-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Quizzes</h1>
          <p className="text-muted-foreground mt-1">Create and manage quizzes for all classes</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-create-quiz">
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={(row) => {
          const q = quizzes.find((x) => x._id === row.id);
          if (!q) return;
          setEditQuiz({ 
            ...q, 
            classIds: Array.isArray(q.classIds) ? q.classIds : (q.classId ? [q.classId] : []),
            subjectId: q.subjectId
          });
          setShowForm(true);
        }}
        onDelete={async (row) => {
          if (!confirm('Delete this quiz?')) return;
          try {
            await api.delete(`/quizzes/${row.id}`);
            await loadQuizzes();
          } catch (err: any) {
            console.error('Delete quiz error:', err);
            alert(err?.response?.data?.message || 'Failed to delete quiz');
          }
        }}
        onView={(row) => {
          const q = quizzes.find((x) => x._id === row.id);
          if (!q) return;
          // Open the same preview dialog used by teachers so admin sees a friendly UI
          setViewingQuiz(q);
        }}
      />

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditQuiz(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
          </DialogHeader>
          <QuizBuilder
            initialData={editQuiz}
            onSubmit={async (payload) => {
              try {
                if (editQuiz && editQuiz._id) {
                  await api.put(`/quizzes/${editQuiz._id}`, payload);
                } else {
                  await api.post('/quizzes', payload);
                }
                setShowForm(false);
                setEditQuiz(null);
                await loadQuizzes();
              } catch (err: any) {
                console.error('Save quiz failed', err);
                alert(err?.response?.data?.message || err?.message || 'Failed to save quiz');
              }
            }}
            onCancel={() => { setShowForm(false); setEditQuiz(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingQuiz} onOpenChange={(open) => !open && setViewingQuiz(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Details - {viewingQuiz?.title}</DialogTitle>
          </DialogHeader>
          {viewingQuiz && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-lg font-semibold">{viewingQuiz.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Classes</p>
                  <p className="text-lg">
                    {Array.isArray(viewingQuiz.classIds)
                      ? viewingQuiz.classIds.map((classId: any) => {
                          const cls = classes.find((c: any) => c._id === classId);
                          return `${cls?.name || classId}${cls?.grade ? ` - ${cls.grade}` : ''}`;
                        }).join(', ')
                      : (classes.find(c => c._id === viewingQuiz.classId)?.name || viewingQuiz.classId || '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-lg">{viewingQuiz.questions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Marks</p>
                  <p className="text-lg">{viewingQuiz.totalMarks || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg">{viewingQuiz.duration || 'No limit'} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg">{viewingQuiz.status || 'Active'}</p>
                </div>
              </div>
              {viewingQuiz.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{viewingQuiz.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Questions Preview</p>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded p-3">
                  {(viewingQuiz.questions || []).map((q: any, idx: number) => (
                    <div key={idx} className="text-sm border-b pb-2 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">Q{idx + 1}: {q.question}</p>
                        <p className="text-xs text-muted-foreground">Marks: {q.marks}</p>
                      </div>
                      <div className="mt-2 space-y-1">
                        {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => {
                          const isCorrect = Number(q.correctAnswer) === oi;
                          return (
                            <div key={oi} className={`flex items-center justify-between px-3 py-1 rounded ${isCorrect ? 'bg-green-50 border border-green-200' : ''}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${isCorrect ? 'bg-green-600' : 'bg-gray-300'}`} />
                                <p className="text-sm">{opt}</p>
                              </div>
                              {isCorrect && (
                                <Badge variant="default" className="ml-2">Correct</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewingQuiz(null)}>Close</Button>
                <Button onClick={() => {
                  setShowForm(true);
                  setEditQuiz({
                    ...viewingQuiz,
                    classId: viewingQuiz.classId,
                    subjectId: viewingQuiz.subjectId
                  });
                  setViewingQuiz(null);
                }}>
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
