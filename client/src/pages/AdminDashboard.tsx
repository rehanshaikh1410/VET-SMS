import StatCard from "@/components/StatCard";
import NoticeCard from "@/components/NoticeCard";
import PerformanceChart from "@/components/PerformanceChart";
import { Users, GraduationCap, BookOpen, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Students", value: 1245, icon: GraduationCap, trend: { value: 12, isPositive: true }, iconColor: "bg-chart-1" },
    { title: "Total Teachers", value: 87, icon: Users, iconColor: "bg-chart-2" },
    { title: "Active Classes", value: 24, icon: BookOpen, trend: { value: 3, isPositive: true }, iconColor: "bg-chart-3" },
    { title: "Active Quizzes", value: 18, icon: ClipboardList, iconColor: "bg-chart-4" },
  ];

  const attendanceData = [
    { name: 'Mon', score: 95 },
    { name: 'Tue', score: 92 },
    { name: 'Wed', score: 88 },
    { name: 'Thu', score: 94 },
    { name: 'Fri', score: 96 },
  ];

  const notices = [
    { title: "Annual Sports Day", content: "Sports day scheduled for December 15th", postedBy: "Principal", timestamp: "2 hours ago", priority: "high" as const },
    { title: "Parent-Teacher Meeting", content: "PTM scheduled for next Saturday from 9 AM to 2 PM", postedBy: "Admin", timestamp: "1 day ago", priority: "medium" as const },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={attendanceData} title="Weekly Attendance %" height={250} />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Notices</h2>
          {notices.map((notice, idx) => (
            <NoticeCard key={idx} {...notice} />
          ))}
        </div>
      </div>
    </div>
  );
}
