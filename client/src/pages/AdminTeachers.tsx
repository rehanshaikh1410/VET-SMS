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

export default function AdminTeachers() {
  const [showForm, setShowForm] = useState(false);

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject' },
    { key: 'experience', label: 'Experience' },
    { key: 'status', label: 'Status' }
  ];

  const data = [
    { id: 'T001', name: 'John Smith', email: 'john@school.edu', phone: '+1234567890', subject: 'Mathematics', experience: '10 years', status: 'Active' },
    { id: 'T002', name: 'Sarah Johnson', email: 'sarah@school.edu', phone: '+1234567891', subject: 'English', experience: '8 years', status: 'Active' },
    { id: 'T003', name: 'Mike Brown', email: 'mike@school.edu', phone: '+1234567892', subject: 'Physics', experience: '12 years', status: 'Active' },
    { id: 'T004', name: 'Emily Davis', email: 'emily@school.edu', phone: '+1234567893', subject: 'Chemistry', experience: '6 years', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6" data-testid="admin-teachers-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Teachers</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove teachers from the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-teacher">
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={(row) => console.log('Edit teacher:', row)}
        onDelete={(row) => console.log('Delete teacher:', row)}
        onView={(row) => console.log('View teacher:', row)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <UserForm type="teacher" onSubmit={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
