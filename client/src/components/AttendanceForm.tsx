import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

interface AttendanceFormProps {
  students: Student[];
  classId: string;
  subjectId: string;
  onSubmit?: (attendance: Record<string, 'present' | 'absent'>) => void;
}

export default function AttendanceForm({ students, classId, subjectId, onSubmit }: AttendanceFormProps) {
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>(
    Object.fromEntries(students.map(s => [s.id, 'present']))
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleToggle = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, status])));
  };

  const handleSubmit = () => {
    onSubmit?.(attendance);
    console.log('Attendance submitted:', { classId, subjectId, date, attendance });
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = students.length - presentCount;

  return (
    <Card className="p-6" data-testid="attendance-form">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold">Mark Attendance</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-500/10">
              Present: {presentCount}
            </Badge>
            <Badge variant="outline" className="bg-red-500/10">
              Absent: {absentCount}
            </Badge>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label>Date</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-md border"
              data-testid="input-date"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')} data-testid="button-mark-all-present">
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')} data-testid="button-mark-all-absent">
              Mark All Absent
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-4 border rounded-md hover-elevate ${
                attendance[student.id] === 'present' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
              }`}
              data-testid={`student-${student.id}`}
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={attendance[student.id] === 'present'}
                  onCheckedChange={() => handleToggle(student.id)}
                  data-testid={`checkbox-${student.id}`}
                />
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">Roll: {student.rollNumber}</p>
                </div>
              </div>
              <Badge variant={attendance[student.id] === 'present' ? 'default' : 'destructive'}>
                {attendance[student.id]}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} data-testid="button-submit-attendance">
            Submit Attendance
          </Button>
        </div>
      </div>
    </Card>
  );
}
