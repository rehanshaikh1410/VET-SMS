import DataTable, { Column } from "@/components/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import PerformanceChart from "@/components/PerformanceChart";

export default function TeacherGrades() {
  const [selectedClass, setSelectedClass] = useState('class-10a');
  const [selectedQuiz, setSelectedQuiz] = useState('quiz-1');

  const columns: Column[] = [
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'name', label: 'Student Name' },
    { key: 'score', label: 'Score' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'grade', label: 'Grade' },
  ];

  const data = [
    { rollNumber: '001', name: 'Alice Johnson', score: 18, totalMarks: 20, percentage: '90%', grade: 'A+' },
    { rollNumber: '002', name: 'Bob Smith', score: 16, totalMarks: 20, percentage: '80%', grade: 'A' },
    { rollNumber: '003', name: 'Charlie Brown', score: 14, totalMarks: 20, percentage: '70%', grade: 'B+' },
    { rollNumber: '004', name: 'Diana Prince', score: 19, totalMarks: 20, percentage: '95%', grade: 'A+' },
    { rollNumber: '005', name: 'Ethan Hunt', score: 15, totalMarks: 20, percentage: '75%', grade: 'B+' },
  ];

  const performanceData = [
    { name: 'Alice', score: 90 },
    { name: 'Bob', score: 80 },
    { name: 'Charlie', score: 70 },
    { name: 'Diana', score: 95 },
    { name: 'Ethan', score: 75 },
  ];

  return (
    <div className="space-y-6" data-testid="teacher-grades-page">
      <div>
        <h1 className="text-3xl font-bold">Student Grades</h1>
        <p className="text-muted-foreground mt-1">View and analyze student performance</p>
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
          <Label>Select Quiz</Label>
          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger data-testid="select-quiz">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quiz-1">Algebra Basics</SelectItem>
              <SelectItem value="quiz-2">Trigonometry</SelectItem>
              <SelectItem value="quiz-3">Geometry</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onView={(row) => console.log('View student details:', row)}
      />

      <PerformanceChart 
        data={performanceData} 
        title="Quiz Performance Distribution" 
        height={300}
      />
    </div>
  );
}
