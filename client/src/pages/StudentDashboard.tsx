import StatCard from "@/components/StatCard";
import TimetableGrid from "@/components/TimetableGrid";
import PerformanceChart from "@/components/PerformanceChart";
import NoticeCard from "@/components/NoticeCard";
import { Calendar, ClipboardCheck, FileText, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const stats = [
    { title: "Attendance", value: "92%", icon: ClipboardCheck, trend: { value: 3, isPositive: true }, iconColor: "bg-chart-1" },
    { title: "Pending Quizzes", value: 2, icon: FileText, iconColor: "bg-chart-2" },
    { title: "Completed Quizzes", value: 15, icon: Award, iconColor: "bg-chart-3" },
    { title: "Average Score", value: "85%", icon: Award, trend: { value: 5, isPositive: true }, iconColor: "bg-chart-4" },
  ];

  const schedule = [
    {
      day: "Today's Schedule - Monday",
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'Mr. Smith', time: '8:00 - 8:45' },
        { period: 2, subject: 'English', teacher: 'Ms. Johnson', time: '8:50 - 9:35' },
        { period: 3, subject: 'Physics', teacher: 'Dr. Brown', time: '9:40 - 10:25' },
        { period: 4, subject: 'Chemistry', teacher: 'Ms. Davis', time: '10:45 - 11:30' },
      ]
    }
  ];

  const performanceData = [
    { name: 'Math', score: 85, average: 78 },
    { name: 'English', score: 92, average: 82 },
    { name: 'Physics', score: 78, average: 75 },
    { name: 'Chemistry', score: 88, average: 80 },
  ];

  const notices = [
    { title: "Assignment Due", content: "Math assignment due this Friday", postedBy: "Mr. Smith", timestamp: "1 hour ago", priority: "urgent" as const },
    { title: "Quiz Tomorrow", content: "Physics quiz scheduled for tomorrow", postedBy: "Dr. Brown", timestamp: "3 hours ago", priority: "high" as const },
  ];

  return (
    <div className="space-y-6" data-testid="student-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your academic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimetableGrid schedule={schedule} />
        </div>
        
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Attendance Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall</span>
                <span className="font-semibold">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground">23 days present out of 25</p>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Important Notices</h3>
            {notices.map((notice, idx) => (
              <NoticeCard key={idx} {...notice} />
            ))}
          </div>
        </div>
      </div>

      <PerformanceChart data={performanceData} title="Subject-wise Performance" height={300} />
    </div>
  );
}
