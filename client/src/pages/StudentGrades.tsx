import { Card } from "@/components/ui/card";
import PerformanceChart from "@/components/PerformanceChart";
import { Badge } from "@/components/ui/badge";
import DataTable, { Column } from "@/components/DataTable";

export default function StudentGrades() {
  const performanceData = [
    { name: 'Math', score: 85, average: 78 },
    { name: 'English', score: 92, average: 82 },
    { name: 'Physics', score: 78, average: 75 },
    { name: 'Chemistry', score: 88, average: 80 },
    { name: 'Biology', score: 90, average: 83 },
  ];

  const columns: Column[] = [
    { key: 'quiz', label: 'Quiz Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date' },
    { key: 'score', label: 'Score' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' },
  ];

  const quizData = [
    { quiz: 'Algebra Basics', subject: 'Mathematics', date: '2024-12-01', score: 18, totalMarks: 20, percentage: '90%' },
    { quiz: 'Grammar Test', subject: 'English', date: '2024-12-02', score: 14, totalMarks: 16, percentage: '87.5%' },
    { quiz: 'Motion & Forces', subject: 'Physics', date: '2024-12-03', score: 22, totalMarks: 30, percentage: '73%' },
    { quiz: 'Chemical Reactions', subject: 'Chemistry', date: '2024-12-04', score: 26, totalMarks: 30, percentage: '86.7%' },
    { quiz: 'Cell Biology', subject: 'Biology', date: '2024-12-05', score: 19, totalMarks: 20, percentage: '95%' },
  ];

  return (
    <div className="space-y-6" data-testid="student-grades-page">
      <div>
        <h1 className="text-3xl font-bold">My Grades</h1>
        <p className="text-muted-foreground mt-1">View your quiz results and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
          <p className="text-3xl font-bold text-primary">86.7%</p>
          <Badge className="mt-2 bg-green-500">Above Average</Badge>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Quizzes Completed</p>
          <p className="text-3xl font-bold">15</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Highest Score</p>
          <p className="text-3xl font-bold">95%</p>
          <p className="text-xs text-muted-foreground mt-1">Biology</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Lowest Score</p>
          <p className="text-3xl font-bold">73%</p>
          <p className="text-xs text-muted-foreground mt-1">Physics</p>
        </Card>
      </div>

      <PerformanceChart 
        data={performanceData} 
        title="Subject-wise Performance vs Class Average" 
        height={300}
      />

      <div>
        <h2 className="text-xl font-semibold mb-4">Quiz History</h2>
        <DataTable
          columns={columns}
          data={quizData}
          searchable={true}
          onView={(row) => console.log('View quiz details:', row)}
        />
      </div>
    </div>
  );
}
