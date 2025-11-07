import PerformanceChart from "@/components/PerformanceChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { useState } from "react";

export default function AdminReports() {
  const [selectedClass, setSelectedClass] = useState('all');
  const [reportType, setReportType] = useState('attendance');

  const attendanceData = [
    { name: 'Class 10-A', score: 95 },
    { name: 'Class 10-B', score: 92 },
    { name: 'Class 9-A', score: 88 },
    { name: 'Class 9-B', score: 94 },
  ];

  const quizPerformanceData = [
    { name: 'Mathematics', score: 85, average: 78 },
    { name: 'English', score: 88, average: 82 },
    { name: 'Physics', score: 82, average: 75 },
    { name: 'Chemistry', score: 87, average: 80 },
  ];

  return (
    <div className="space-y-6" data-testid="admin-reports-page">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">View comprehensive reports on attendance and performance</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 flex-wrap items-end">
          <div className="w-64 space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger data-testid="select-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="quiz">Quiz Performance</SelectItem>
                <SelectItem value="overall">Overall Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-64 space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger data-testid="select-class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="class-10a">Class 10-A</SelectItem>
                <SelectItem value="class-10b">Class 10-B</SelectItem>
                <SelectItem value="class-9a">Class 9-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart 
          data={attendanceData} 
          title="Class-wise Attendance %" 
          height={300}
        />
        <PerformanceChart 
          data={quizPerformanceData} 
          title="Subject-wise Quiz Performance" 
          height={300}
        />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Average Attendance</p>
            <p className="text-3xl font-bold">92.3%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Quiz Score</p>
            <p className="text-3xl font-bold">85.5%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Quizzes</p>
            <p className="text-3xl font-bold">48</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
