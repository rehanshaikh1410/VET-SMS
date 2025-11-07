import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import UserForm from "@/components/UserForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminStudents() {
  const [showForm, setShowForm] = useState(false);

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'class', label: 'Class' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' }
  ];

  const data = [
    { id: 'S001', name: 'Alice Johnson', rollNumber: '2024001', class: 'Class 10-A', email: 'alice@school.edu', phone: '+1234560001', status: 'Active' },
    { id: 'S002', name: 'Bob Smith', rollNumber: '2024002', class: 'Class 10-A', email: 'bob@school.edu', phone: '+1234560002', status: 'Active' },
    { id: 'S003', name: 'Charlie Brown', rollNumber: '2024003', class: 'Class 10-B', email: 'charlie@school.edu', phone: '+1234560003', status: 'Active' },
    { id: 'S004', name: 'Diana Prince', rollNumber: '2024004', class: 'Class 9-A', email: 'diana@school.edu', phone: '+1234560004', status: 'Active' },
    { id: 'S005', name: 'Ethan Hunt', rollNumber: '2024005', class: 'Class 9-B', email: 'ethan@school.edu', phone: '+1234560005', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6" data-testid="admin-students-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove students from the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-student">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={(row) => console.log('Edit student:', row)}
        onDelete={(row) => console.log('Delete student:', row)}
        onView={(row) => console.log('View student:', row)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <UserForm type="student" onSubmit={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
