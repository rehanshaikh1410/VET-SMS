import AttendanceForm from "@/components/AttendanceForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function TeacherAttendance() {
  const [selectedClass, setSelectedClass] = useState('class-10a');
  const [selectedSubject, setSelectedSubject] = useState('math');

  const students = [
    { id: 'S001', name: 'Alice Johnson', rollNumber: '001' },
    { id: 'S002', name: 'Bob Smith', rollNumber: '002' },
    { id: 'S003', name: 'Charlie Brown', rollNumber: '003' },
    { id: 'S004', name: 'Diana Prince', rollNumber: '004' },
    { id: 'S005', name: 'Ethan Hunt', rollNumber: '005' },
    { id: 'S006', name: 'Fiona Green', rollNumber: '006' },
    { id: 'S007', name: 'George White', rollNumber: '007' },
  ];

  return (
    <div className="space-y-6" data-testid="teacher-attendance-page">
      <div>
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record student attendance for your classes</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="w-64 space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger data-testid="select-class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class-10a">Class 10-A</SelectItem>
              <SelectItem value="class-10b">Class 10-B</SelectItem>
              <SelectItem value="class-9a">Class 9-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-64 space-y-2">
          <Label>Select Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger data-testid="select-subject">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AttendanceForm
        students={students}
        classId={selectedClass}
        subjectId={selectedSubject}
      />
    </div>
  );
}
