import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminClasses() {
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  const classColumns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Class Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'students', label: 'Students' },
    { key: 'classTeacher', label: 'Class Teacher' },
  ];

  const classData = [
    { id: 'C001', name: 'Class 10-A', grade: '10', students: 45, classTeacher: 'Mr. Smith' },
    { id: 'C002', name: 'Class 10-B', grade: '10', students: 42, classTeacher: 'Ms. Johnson' },
    { id: 'C003', name: 'Class 9-A', grade: '9', students: 48, classTeacher: 'Dr. Brown' },
  ];

  const subjectColumns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    { key: 'teacher', label: 'Assigned Teacher' },
    { key: 'classes', label: 'Classes' },
  ];

  const subjectData = [
    { id: 'SUB001', name: 'Mathematics', code: 'MATH101', teacher: 'Mr. Smith', classes: '10-A, 10-B' },
    { id: 'SUB002', name: 'English', code: 'ENG101', teacher: 'Ms. Johnson', classes: '10-A, 9-A' },
    { id: 'SUB003', name: 'Physics', code: 'PHY101', teacher: 'Dr. Brown', classes: '10-A, 10-B' },
  ];

  return (
    <div className="space-y-6" data-testid="admin-classes-page">
      <div>
        <h1 className="text-3xl font-bold">Manage Classes & Subjects</h1>
        <p className="text-muted-foreground mt-1">Create and manage classes, subjects, and assignments</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Classes</h2>
            <Button onClick={() => setShowClassForm(true)} data-testid="button-add-class">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
          <DataTable
            columns={classColumns}
            data={classData}
            onEdit={(row) => console.log('Edit class:', row)}
            onDelete={(row) => console.log('Delete class:', row)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Subjects</h2>
            <Button onClick={() => setShowSubjectForm(true)} data-testid="button-add-subject">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </div>
          <DataTable
            columns={subjectColumns}
            data={subjectData}
            onEdit={(row) => console.log('Edit subject:', row)}
            onDelete={(row) => console.log('Delete subject:', row)}
          />
        </div>
      </div>

      <Dialog open={showClassForm} onOpenChange={setShowClassForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input placeholder="e.g., Class 10-A" data-testid="input-class-name" />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Input placeholder="e.g., 10" data-testid="input-grade" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowClassForm(false)}>Cancel</Button>
              <Button onClick={() => setShowClassForm(false)} data-testid="button-submit-class">Create Class</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubjectForm} onOpenChange={setShowSubjectForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input placeholder="e.g., Mathematics" data-testid="input-subject-name" />
            </div>
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input placeholder="e.g., MATH101" data-testid="input-subject-code" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubjectForm(false)}>Cancel</Button>
              <Button onClick={() => setShowSubjectForm(false)} data-testid="button-submit-subject">Create Subject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
