import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PerformanceChart from "@/components/PerformanceChart";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function StudentAttendance() {
  const attendanceData = [
    { name: 'Math', score: 95 },
    { name: 'English', score: 92 },
    { name: 'Physics', score: 88 },
    { name: 'Chemistry', score: 90 },
    { name: 'Biology', score: 94 },
  ];

  const recentAttendance = [
    { date: '2024-12-09', day: 'Monday', status: 'Present', classes: 4 },
    { date: '2024-12-08', day: 'Sunday', status: 'Holiday', classes: 0 },
    { date: '2024-12-07', day: 'Saturday', status: 'Holiday', classes: 0 },
    { date: '2024-12-06', day: 'Friday', status: 'Present', classes: 4 },
    { date: '2024-12-05', day: 'Thursday', status: 'Present', classes: 4 },
    { date: '2024-12-04', day: 'Wednesday', status: 'Absent', classes: 4 },
    { date: '2024-12-03', day: 'Tuesday', status: 'Present', classes: 4 },
  ];

  return (
    <div className="space-y-6" data-testid="student-attendance-page">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground mt-1">Track your attendance record</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Overall Attendance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">92%</span>
            </div>
            <Progress value={92} className="h-3" />
            <p className="text-xs text-muted-foreground">23 days present out of 25</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>December</span>
              <span className="font-semibold">95%</span>
            </div>
            <Progress value={95} className="h-3" />
            <p className="text-xs text-muted-foreground">19 days present out of 20</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">This Week</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Week 49</span>
              <span className="font-semibold">80%</span>
            </div>
            <Progress value={80} className="h-3" />
            <p className="text-xs text-muted-foreground">4 days present out of 5</p>
          </div>
        </Card>
      </div>

      <PerformanceChart 
        data={attendanceData} 
        title="Subject-wise Attendance %" 
        height={300}
      />

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Attendance</h3>
        <div className="space-y-3">
          {recentAttendance.map((record) => (
            <div 
              key={record.date} 
              className="flex items-center justify-between p-3 border rounded-md"
              data-testid={`attendance-record-${record.date}`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{record.day}</p>
                  <p className="text-sm text-muted-foreground">{record.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {record.classes > 0 && (
                  <span className="text-sm text-muted-foreground">{record.classes} classes</span>
                )}
                <Badge 
                  variant={
                    record.status === 'Present' ? 'default' : 
                    record.status === 'Absent' ? 'destructive' : 
                    'outline'
                  }
                >
                  {record.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
