import StatCard from "@/components/StatCard";
import TimetableGrid from "@/components/TimetableGrid";
import PerformanceChart from "@/components/PerformanceChart";
import NoticeCard from "@/components/NoticeCard";
import { Calendar, ClipboardCheck, FileText, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const [studentClassId, setStudentClassId] = useState<string | null>(null);

  // Get student info to find class ID
  const { data: studentData = {} } = useQuery({
    queryKey: ['studentStats'],
    queryFn: async () => {
      try {
        const response = await api.get('/me');
        if (response.data?.classId) {
          setStudentClassId(response.data.classId);
        }
        return response.data;
      } catch (err) {
        return {};
      }
    }
  });

  // Fetch notices (real-time)
  const { data: notices = [], isLoading: noticesLoading } = useQuery({
    queryKey: ['studentNotices'],
    queryFn: async () => {
      const response = await api.get('/notices');
      return response.data.slice(0, 2); // Show only first 2
    }
  });

  // Fetch quizzes (real-time)
  const { data: quizzes = [] } = useQuery({
    queryKey: ['studentQuizzes'],
    queryFn: async () => {
      const response = await api.get('/quizzes/student');
      return response.data || [];
    }
  });

  // Fetch timetable for student's class (real-time)
  const { data: timetableData = null } = useQuery({
    queryKey: ['studentTimetable'],
    queryFn: async () => {
      try {
        const response = await api.get(`/timetables/for-current-student`);
        return response.data || null;
      } catch (err) {
        console.error('Failed to fetch timetable:', err);
        return null;
      }
    }
  });

  // Fetch attendance records (real-time)
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['studentAttendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/attendance/student');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        return [];
      }
    }
  });

  // Fetch quiz submissions for real-time scores (real-time)
  const { data: submissions = [] } = useQuery({
    queryKey: ['studentSubmissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/quiz-submissions/student');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
        return [];
      }
    }
  });

  // Fetch class performance for comparison (real-time)
  const { data: classPerformance = [] } = useQuery({
    queryKey: ['classPerformanceAverage'],
    queryFn: async () => {
      try {
        const response = await api.get('/quiz-performance/class');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch class performance:', err);
        return [];
      }
    }
  });

  // Subscribe to real-time updates
  useWebSocket(
    (noticeUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['studentNotices'] });
    },
    (attendanceUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['studentStats'] });
    },
    (quizUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['studentQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['classPerformanceAverage'] });
    },
    (timetableUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['studentTimetable'] });
      queryClient.invalidateQueries({ queryKey: ['allSubjects'] });
      queryClient.invalidateQueries({ queryKey: ['allTeachers'] });
    }
  );

  // Calculate quiz stats
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter((q: any) => q.submission).length;
  const pendingQuizzes = totalQuizzes - completedQuizzes;
  
  // Calculate average score from submissions
  const validSubmissions = submissions.filter((s: any) => s.score !== undefined && s.totalMarks !== undefined && s.totalMarks > 0);
  const averageScore = validSubmissions.length > 0 
    ? Math.round((validSubmissions.reduce((sum: number, s: any) => sum + (s.score / s.totalMarks * 100), 0) / validSubmissions.length))
    : 0;

  // Calculate attendance percentage from real data
  const recordsArray = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const presentCount = recordsArray.filter((r: any) => r.status === 'Present').length;
  const totalAttendanceDays = recordsArray.length;
  const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentCount / totalAttendanceDays) * 100) : 0;

  const stats = [
    { 
      title: "Attendance", 
      value: `${attendancePercentage}%`, 
      icon: ClipboardCheck, 
      trend: attendancePercentage > 80 ? { value: 3, isPositive: true } : { value: 1, isPositive: false }, 
      iconColor: "bg-chart-1" 
    },
    { 
      title: "Pending Quizzes", 
      value: pendingQuizzes, 
      icon: FileText, 
      iconColor: "bg-chart-2" 
    },
    { 
      title: "Completed Quizzes", 
      value: completedQuizzes, 
      icon: Award, 
      iconColor: "bg-chart-3" 
    },
    { 
      title: "Average Score", 
      value: averageScore > 0 ? `${averageScore}%` : "—", 
      icon: Award, 
      trend: averageScore > 0 ? { value: 5, isPositive: true } : undefined, 
      iconColor: "bg-chart-4" 
    },
  ];

  // Calculate subject-wise performance from real submissions
  const calculateSubjectPerformance = () => {
    if (validSubmissions.length === 0) {
      return [
        { name: 'No Data', score: 0, average: 0 }
      ];
    }

    const subjectMap = new Map<string, { total: number; possible: number; quizzes: string[] }>();
    validSubmissions.forEach((s: any) => {
      const subject = s.quizId?.subjectName || 'Unknown';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, possible: 0, quizzes: [] });
      }
      const data = subjectMap.get(subject)!;
      data.total += s.score;
      data.possible += s.totalMarks;
      if (!data.quizzes.includes(s.quizId?.title || '')) {
        data.quizzes.push(s.quizId?.title || '');
      }
    });

    const result = Array.from(subjectMap.entries()).map(([subject, data]) => {
      const studentScore = data.possible > 0 ? Math.round((data.total / data.possible) * 100) : 0;
      const classAvg = classPerformance.find((cp: any) => cp.subject === subject)?.average || 0;
      return {
        name: subject,
        score: studentScore,
        average: classAvg
      };
    });

    return result.length > 0 ? result : [{ name: 'No Data', score: 0, average: 0 }];
  };

  const performanceData = calculateSubjectPerformance();

  // Fetch subjects for timetable display (real-time)
  const { data: allSubjects = [] } = useQuery({
    queryKey: ['allSubjects'],
    queryFn: async () => {
      try {
        const response = await api.get('/subjects');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        return [];
      }
    }
  });

  // Fetch teachers for timetable display (real-time)
  const { data: allTeachers = [] } = useQuery({
    queryKey: ['allTeachers'],
    queryFn: async () => {
      try {
        const response = await api.get('/teachers');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
        return [];
      }
    }
  });

  // Convert timetable to schedule format for TimetableGrid with real data
  // Show only today's timetable (e.g., Tuesday). If today's entries are missing,
  // fall back to the first available day.
  const schedule = (() => {
    if (!timetableData || !Array.isArray(timetableData.entries) || timetableData.entries.length === 0) return [];

    // Group entries by day
    const byDay = new Map<string, any[]>();
    (timetableData.entries || []).forEach((entry: any) => {
      const day = (entry.day || 'Timetable').toString();
      if (!byDay.has(day)) {
        byDay.set(day, []);
      }
      // Find subject and teacher names
      const subject = allSubjects.find((s: any) => s._id === entry.subjectId)?.name || entry.subjectId || 'Subject';
      const teacher = allTeachers.find((t: any) => t._id === entry.teacherId)?.name || entry.teacherId || 'TBD';

      byDay.get(day)!.push({
        period: entry.period || 1,
        subject: subject,
        teacher: teacher,
        time: entry.time || '—'
      });
    });

    // Normalize keys and find today's entries
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayKey = Array.from(byDay.keys()).find(k => k.toLowerCase() === todayName.toLowerCase());

    if (dayKey) {
      const entries = byDay.get(dayKey)!.sort((a: any, b: any) => a.period - b.period);
      return [{ day: `Today's Schedule - ${dayKey}`, entries }];
    }

    // If no exact match for today, try to find any entry with matching weekday abbreviation
    const abbrevKey = Array.from(byDay.keys()).find(k => k.toLowerCase().startsWith(todayName.slice(0,3).toLowerCase()));
    if (abbrevKey) {
      const entries = byDay.get(abbrevKey)!.sort((a: any, b: any) => a.period - b.period);
      return [{ day: `Today's Schedule - ${abbrevKey}`, entries }];
    }

    // Fallback: show the first available day
    const first = Array.from(byDay.entries())[0];
    if (first) {
      const [day, entries] = first;
      return [{ day, entries: entries.sort((a: any, b: any) => a.period - b.period) }];
    }

    return [];
  })();

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
          {schedule.length > 0 ? (
            <TimetableGrid schedule={schedule} />
          ) : (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Class Timetable</h3>
              <p className="text-sm text-muted-foreground">No timetable assigned for your class yet. Check back soon!</p>
            </Card>
          )}
        </div>
        
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Attendance Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall</span>
                <span className="font-semibold">{attendancePercentage}%</span>
              </div>
              <Progress value={attendancePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">{presentCount} days present out of {totalAttendanceDays}</p>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Important Notices</h3>
            {noticesLoading ? (
              <p className="text-sm text-muted-foreground">Loading notices...</p>
            ) : notices.length > 0 ? (
              notices.map((notice: any) => (
                <NoticeCard 
                  key={notice._id}
                  _id={notice._id}
                  title={notice.title}
                  content={notice.content}
                  postedBy={notice.postedBy || { _id: '', name: 'Admin' }}
                  createdAt={notice.createdAt}
                  priority={notice.priority}
                  audience={notice.audience}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notices</p>
            )}
          </div>
        </div>
      </div>

      <PerformanceChart data={performanceData} title="Subject-wise Performance" height={300} />

      {/* Quiz Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Quizzes</h3>
          <a href="/student/quizzes" className="text-sm text-primary hover:underline">View All</a>
        </div>
        {quizzes.length > 0 ? (
          <div className="space-y-3">
            {quizzes.slice(0, 3).map((quiz: any) => (
              <div key={quiz._id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-sm text-muted-foreground">{quiz.questionCount} questions • {quiz.totalMarks} marks</p>
                </div>
                {quiz.submission ? (
                  <div className="text-right">
                    <p className="font-semibold text-primary">Score: {quiz.submission.score}/{quiz.totalMarks}</p>
                  </div>
                ) : (
                  <a href="/student/quizzes" className="text-sm text-primary font-medium hover:underline">Start</a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No quizzes assigned yet</p>
        )}
      </Card>
    </div>
  );
}
