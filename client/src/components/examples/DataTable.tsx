import DataTable, { Column } from '../DataTable';

export default function DataTableExample() {
  const columns: Column[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status' }
  ];

  const data = [
    { id: 'T001', name: 'John Smith', email: 'john@school.edu', role: 'Teacher', status: 'Active' },
    { id: 'T002', name: 'Sarah Johnson', email: 'sarah@school.edu', role: 'Teacher', status: 'Active' },
    { id: 'T003', name: 'Mike Brown', email: 'mike@school.edu', role: 'Teacher', status: 'Inactive' },
    { id: 'S001', name: 'Emma Wilson', email: 'emma@school.edu', role: 'Student', status: 'Active' },
    { id: 'S002', name: 'James Davis', email: 'james@school.edu', role: 'Student', status: 'Active' },
  ];

  const handleEdit = (row: any) => console.log('Edit:', row);
  const handleDelete = (row: any) => console.log('Delete:', row);
  const handleView = (row: any) => console.log('View:', row);

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />
    </div>
  );
}
