import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import QuizBuilder from "@/components/QuizBuilder";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeacherQuizzes() {
  const [showForm, setShowForm] = useState(false);

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Quiz Title' },
    { key: 'class', label: 'Class' },
    { key: 'questions', label: 'Questions' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'status', label: 'Status' }
  ];

  const data = [
    { id: 'Q001', title: 'Algebra Basics', class: 'Class 10-A', questions: 10, totalMarks: 20, submitted: '35/45', status: 'Active' },
    { id: 'Q002', title: 'Trigonometry', class: 'Class 10-B', questions: 12, totalMarks: 24, submitted: '40/42', status: 'Active' },
    { id: 'Q003', title: 'Geometry', class: 'Class 9-A', questions: 8, totalMarks: 16, submitted: '48/48', status: 'Completed' },
  ];

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

      <DataTable
        columns={columns}
        data={data}
        onEdit={(row) => console.log('Edit quiz:', row)}
        onDelete={(row) => console.log('Delete quiz:', row)}
        onView={(row) => console.log('View results:', row)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
          </DialogHeader>
          <QuizBuilder onSubmit={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
