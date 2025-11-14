import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import QuizBuilder from "@/components/QuizBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quizApi } from "@/lib/quizApi";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from '@/hooks/use-websocket';

export default function TeacherQuizzes() {
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [viewingQuiz, setViewingQuiz] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Quiz Title' },
    { key: 'classes', label: 'Classes' },
    { key: 'questionCount', label: 'Questions' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'submissionCount', label: 'Submitted' },
    { key: 'status', label: 'Status' }
  ];

  const { data: quizzes = [], isLoading, refetch } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: quizApi.getTeacherQuizzes
  });

  // Subscribe to websocket updates to refresh quizzes in real-time
  useWebSocket(
    undefined,
    undefined,
    (quizUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
    },
    undefined
  );

  // Transform quizzes to match DataTable columns
  const transformedQuizzes = quizzes.map((quiz: any) => ({
    id: quiz._id || quiz.id,
    title: quiz.title,
    // Server returns className with divisions concatenated; use it if available
    classes: quiz.className || 'N/A',
    questionCount: quiz.questions?.length || 0,
    totalMarks: quiz.totalMarks || 0,
    submissionCount: quiz.submissionCount || 0,
    status: 'Active',
    _original: quiz // Keep original data for editing
  }));

  const createQuizMutation = useMutation({
    mutationFn: quizApi.createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
      toast({ title: "Success", description: "Quiz created successfully" });
      setShowForm(false);
      setEditingQuiz(null);
    },
    onError: (error: any) => {
      console.error('Create quiz error:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to create quiz. Please try again.';
      toast({ 
        title: "Error", 
        description: message, 
        variant: "destructive" 
      });
    }
  });

  const updateQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.updateQuiz(editingQuiz._id || editingQuiz.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
      toast({ title: "Success", description: "Quiz updated successfully" });
      setShowForm(false);
      setEditingQuiz(null);
    },
    onError: (error: any) => {
      console.error('Update quiz error:', error);
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to update quiz. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
      toast({ title: "Success", description: "Quiz deleted successfully" });
    },
    onError: (error: any) => {
      console.error('Delete quiz error:', error);
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to delete quiz. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  const handleEdit = (row: any) => {
    // Get the full quiz data for editing
    const quizData = quizzes.find((q: any) => (q._id || q.id) === row.id);
    if (quizData) {
      setEditingQuiz(quizData);
      setShowForm(true);
    }
  };

  const handleView = (row: any) => {
    // Get the full quiz data for viewing
    const quizData = quizzes.find((q: any) => (q._id || q.id) === row.id);
    if (quizData) {
      setViewingQuiz(quizData);
    }
  };

  const handleDelete = (row: any) => {
    if (window.confirm(`Are you sure you want to delete "${row.title}"?`)) {
      deleteQuizMutation.mutate(row.id);
    }
  };

  const handleSubmit = (data: any) => {
    if (editingQuiz) {
      updateQuizMutation.mutate(data);
    } else {
      createQuizMutation.mutate(data);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingQuiz(null);
  };

  return (
    <div className="space-y-6" data-testid="teacher-quizzes-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground mt-1">Create and manage quizzes for your classes</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-create-quiz">
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading quizzes...</div>
      ) : (
        <DataTable
          columns={columns}
          data={transformedQuizzes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
          </DialogHeader>
          <QuizBuilder 
            initialData={editingQuiz}
            onSubmit={handleSubmit} 
            onCancel={handleCloseForm}
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
                  <p className="text-sm font-medium text-muted-foreground">Class</p>
                  <p className="text-lg">{viewingQuiz.className || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-lg">{viewingQuiz.questions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Marks</p>
                  <p className="text-lg">{viewingQuiz.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg">{viewingQuiz.duration || 'No limit'} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                  <p className="text-lg">{viewingQuiz.submissionCount || 0}</p>
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
                <Button variant="outline" onClick={() => setViewingQuiz(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewingQuiz(null);
                  handleEdit({ id: viewingQuiz._id || viewingQuiz.id });
                }}>
                  Edit Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
