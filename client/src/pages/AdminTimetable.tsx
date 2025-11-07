import TimetableGrid from "@/components/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function AdminTimetable() {
  const [selectedClass, setSelectedClass] = useState('class-10a');

  const schedule = [
    {
      day: 'Monday',
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'Mr. Smith', time: '8:00 - 8:45' },
        { period: 2, subject: 'English', teacher: 'Ms. Johnson', time: '8:50 - 9:35' },
        { period: 3, subject: 'Physics', teacher: 'Dr. Brown', time: '9:40 - 10:25' },
        { period: 4, subject: 'Chemistry', teacher: 'Ms. Davis', time: '10:45 - 11:30' },
      ]
    },
    {
      day: 'Tuesday',
      entries: [
        { period: 1, subject: 'Biology', teacher: 'Dr. Wilson', time: '8:00 - 8:45' },
        { period: 2, subject: 'History', teacher: 'Mr. Taylor', time: '8:50 - 9:35' },
        { period: 3, subject: 'Computer Science', teacher: 'Ms. Anderson', time: '9:40 - 10:25' },
        { period: 4, subject: 'Physical Education', teacher: 'Coach Lee', time: '10:45 - 11:30' },
      ]
    }
  ];

  return (
    <div className="space-y-6" data-testid="admin-timetable-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Timetable</h1>
          <p className="text-muted-foreground mt-1">Create and edit class timetables</p>
        </div>
        <Button data-testid="button-edit-timetable">
          <Plus className="h-4 w-4 mr-2" />
          Edit Timetable
        </Button>
      </div>

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

      <TimetableGrid schedule={schedule} />
    </div>
  );
}
