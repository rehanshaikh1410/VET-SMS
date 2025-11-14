import StatCard from "@/components/StatCard";
import TimetableGrid from "@/components/TimetableGrid";
import PerformanceChart from "@/components/PerformanceChart";
import { BookOpen, Users, ClipboardCheck, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState } from "react";
import { useLocation } from 'wouter';

export default function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const { data: me = {} } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const resp = await api.get('/me');
        if (resp?.data?._id) setTeacherId(resp.data._id);
        return resp.data || {};
      } catch (e) {
        return {};
      }
    }
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const resp = await api.get('/classes');
      return Array.isArray(resp.data) ? resp.data : [];
    }
  });

  const teacherClasses = (allClasses || []).filter((c: any) => {
    if (!teacherId) return false;
    const ct = (c.classTeacher && (c.classTeacher._id || c.classTeacher)) || null;
    return ct && ct.toString() === teacherId.toString();
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const resp = await api.get('/students');
      return Array.isArray(resp.data) ? resp.data : [];
    }
  });

  const totalStudents = students.filter((s: any) => teacherClasses.some((c: any) => c._id.toString() === s.classId)).length;

  const { data: quizzes = [] } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: async () => {
      try {
        const resp = await api.get('/quizzes/teacher');
        return Array.isArray(resp.data) ? resp.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  const pendingQuizzes = (quizzes || []).filter((q: any) => (q.submissionCount || 0) === 0).length;

  const { data: timetableData = [] } = useQuery({
    queryKey: ['teacherTimetable'],
    queryFn: async () => {
      try {
        const resp = await api.get('/timetables/teacher');
        return Array.isArray(resp.data) ? resp.data : [];
      } catch (e) {
        return [];
      }
    }
  });

  const { data: classesAttendance = [] } = useQuery({
    queryKey: ['teacherClassesAttendance', teacherClasses.map((c: any) => c._id)],
    enabled: teacherClasses.length > 0,
    queryFn: async () => {
      try {
        const results = await Promise.all(teacherClasses.map(async (c: any) => {
          const resp = await api.get(`/attendance/class/${c._id}`);
          return { classId: c._id, students: Array.isArray(resp.data) ? resp.data : [] };
        }));
        return results;
      } catch (e) {
        return [];
      }
    }
  });

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  let presentCount = 0;
  let totalCount = 0;
  classesAttendance.forEach((c: any) => {
    (c.students || []).forEach((s: any) => {
      const records = Array.isArray(s.attendance) ? s.attendance : [];
      records.forEach((r: any) => {
        const d = r.date ? new Date(r.date) : null;
        if (d && isSameDay(d, today)) {
          totalCount += 1;
          if (r.status === 'Present') presentCount += 1;
        }
      });
    });
  });

  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const schedule = (() => {
    if (!Array.isArray(timetableData) || timetableData.length === 0) return [];
    const byDay = new Map<string, any[]>();
    timetableData.forEach((entry: any) => {
      const day = (entry.dayOfWeek || entry.day || 'Timetable').toString();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push({ period: entry.period || 1, subject: entry.subjectName || entry.subjectId || 'Subject', teacher: entry.teacherName || 'You', time: entry.time || '—' });
    });
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayKey = Array.from(byDay.keys()).find(k => k.toLowerCase() === todayName.toLowerCase());
    if (dayKey) {
      const entries = byDay.get(dayKey)!.sort((a: any, b: any) => a.period - b.period);
      return [{ day: `Today's Schedule - ${dayKey}`, entries }];
    }
    const first = Array.from(byDay.entries())[0];
    if (first) {
      const [day, entries] = first;
      return [{ day, entries: entries.sort((a: any, b: any) => a.period - b.period) }];
    }
    return [];
  })();

  useWebSocket(
    (noticeUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    (attendanceUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['teacherClassesAttendance'] });
    },
    (quizUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
    },
    (timetableUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['teacherTimetable'] });
    }
  );

  const [, setLocation] = useLocation();

  const stats = [
    { title: 'My Classes', value: teacherClasses.length, icon: BookOpen, iconColor: 'bg-chart-1' },
    { title: 'Total Students', value: totalStudents, icon: Users, iconColor: 'bg-chart-2' },
    { title: 'Pending Quizzes', value: pendingQuizzes, icon: FileText, iconColor: 'bg-chart-3' },
    { title: "Today's Attendance", value: `${attendancePercentage}%`, icon: ClipboardCheck, iconColor: 'bg-chart-4' }
  ];

  const performanceData = (classesAttendance || []).map((c: any) => {
    let classPresent = 0;
    let classTotal = 0;
    (c.students || []).forEach((s: any) => {
      const records = Array.isArray(s.attendance) ? s.attendance : [];
      records.forEach((r: any) => {
        if (r.status) {
          classTotal += 1;
          if (r.status === 'Present') classPresent += 1;
        }
      });
    });
    const pct = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
    const classInfo = allClasses.find((cl: any) => cl._id.toString() === c.classId.toString());
    return { name: classInfo ? `${classInfo.name}${classInfo.grade ? ` - ${classInfo.grade}` : ''}` : `Class ${c.classId}`, score: pct };
  });

  return (
    <div className="space-y-6" data-testid="teacher-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your schedule and class overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {schedule.length > 0 ? <TimetableGrid schedule={schedule} /> : (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Today's Timetable</h3>
              <p className="text-sm text-muted-foreground">No timetable entries for today.</p>
            </Card>
          )}

          <div className="mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" data-testid="button-mark-attendance" onClick={() => setLocation('/teacher/attendance')}>Mark Attendance</Button>
                <Button size="sm" variant="outline" data-testid="button-create-quiz" onClick={() => setLocation('/teacher/quizzes')}>Create Quiz</Button>
                <Button size="sm" variant="outline" data-testid="button-view-students" onClick={() => setLocation('/teacher/grades')}>View Students</Button>
              </div>
            </Card>
          </div>
        </div>
        <PerformanceChart data={performanceData} title="Class Attendance Overview" height={300} />
      </div>
    </div>
  );
}
