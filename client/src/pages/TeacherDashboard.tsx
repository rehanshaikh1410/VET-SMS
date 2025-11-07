import StatCard from "@/components/StatCard";
import TimetableGrid from "@/components/TimetableGrid";
import PerformanceChart from "@/components/PerformanceChart";
import { BookOpen, Users, ClipboardCheck, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const stats = [
    { title: "My Classes", value: 4, icon: BookOpen, iconColor: "bg-chart-1" },
    { title: "Total Students", value: 142, icon: Users, iconColor: "bg-chart-2" },
    { title: "Pending Quizzes", value: 3, icon: FileText, iconColor: "bg-chart-3" },
    { title: "Today's Attendance", value: "95%", icon: ClipboardCheck, iconColor: "bg-chart-4" },
  ];

  const todaySchedule = [
    {
      day: "Today's Schedule",
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'You', time: '8:00 - 8:45' },
        { period: 3, subject: 'Mathematics', teacher: 'You', time: '9:40 - 10:25' },
        { period: 5, subject: 'Mathematics', teacher: 'You', time: '11:30 - 12:15' },
      ]
    }
  ];

  const performanceData = [
    { name: 'Class 1', score: 85 },
    { name: 'Class 2', score: 78 },
    { name: 'Class 3', score: 92 },
    { name: 'Class 4', score: 88 },
  ];

  return (
    <div className="space-y-6" data-testid="teacher-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your schedule and student performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TimetableGrid schedule={todaySchedule} />
          <div className="mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" data-testid="button-mark-attendance">Mark Attendance</Button>
                <Button size="sm" variant="outline" data-testid="button-create-quiz">Create Quiz</Button>
                <Button size="sm" variant="outline" data-testid="button-view-students">View Students</Button>
              </div>
            </Card>
          </div>
        </div>
        <PerformanceChart data={performanceData} title="Class Average Performance" height={300} />
      </div>
    </div>
  );
}
