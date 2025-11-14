import TimetableGrid from "@/components/TimetableGrid";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function TeacherTimetable() {
  // Load teacher's timetable entries
  const { data: timetables = [], isLoading, error } = useQuery({
    queryKey: ['teacherTimetable'],
    queryFn: async () => {
      try {
        const res = await api.get('/timetables/teacher');
        return res.data || [];
      } catch (err) {
        console.error('Failed to load teacher timetable', err);
        return [];
      }
    }
  });

  // Group timetable entries by day
  const groupByDay = (entries: any[]) => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groupedByDay: { [key: string]: any[] } = {};

    entries.forEach((entry) => {
      const dayName = entry.dayOfWeek || 'Unknown';
      if (!groupedByDay[dayName]) {
        groupedByDay[dayName] = [];
      }
      groupedByDay[dayName].push(entry);
    });

    // Sort by day order and then by period
    return daysOrder
      .filter((day) => groupedByDay[day])
      .map((day) => ({
        day,
        entries: groupedByDay[day]
          .sort((a, b) => (a.period || 0) - (b.period || 0))
          .map((entry) => ({
            period: entry.period || 0,
            subject: entry.subject?.name || entry.subjectName || 'N/A',
            teacher: `You - ${entry.class?.name || entry.className || 'N/A'}`,
            time: entry.timeSlot || 'N/A',
          }))
      }));
  };

  const schedule = groupByDay(timetables);

  return (
    <div className="space-y-6" data-testid="teacher-timetable-page">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground mt-1">View your weekly teaching schedule</p>
      </div>

      {isLoading && (
        <Card className="p-6 text-center text-muted-foreground">
          Loading timetable...
        </Card>
      )}

      {error && (
        <Card className="p-6 text-center text-red-500">
          Failed to load timetable. Please try again later.
        </Card>
      )}

      {!isLoading && !error && schedule.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          No timetable entries found for you.
        </Card>
      )}

      {!isLoading && !error && schedule.length > 0 && (
        <TimetableGrid schedule={schedule} />
      )}
    </div>
  );
}
