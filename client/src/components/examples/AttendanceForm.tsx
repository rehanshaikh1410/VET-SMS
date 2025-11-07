import AttendanceForm from '../AttendanceForm';

export default function AttendanceFormExample() {
  const students = [
    { id: 'S001', name: 'Alice Johnson', rollNumber: '001' },
    { id: 'S002', name: 'Bob Smith', rollNumber: '002' },
    { id: 'S003', name: 'Charlie Brown', rollNumber: '003' },
    { id: 'S004', name: 'Diana Prince', rollNumber: '004' },
    { id: 'S005', name: 'Ethan Hunt', rollNumber: '005' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <AttendanceForm
        students={students}
        classId="C001"
        subjectId="SUB001"
      />
    </div>
  );
}
