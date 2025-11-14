import TimetableGrid from "@/components/TimetableGrid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function StudentTimetable() {
  const queryClient = useQueryClient();

  // Fetch timetable for student's class from API (authenticated endpoint)
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['studentTimetable'],
    queryFn: async () => {
      try {
        console.log('Fetching timetable for current student');
        const response = await api.get(`/timetables/for-current-student`);
        console.log('Timetable response:', response.data);
        return response.data || null;
      } catch (err) {
        console.error('Failed to fetch timetable:', err);
        return null;
      }
    }
  });

  // Fetch subjects and teachers for name mapping
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        const response = await api.get('/subjects');
        return response.data || [];
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        return [];
      }
    }
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await api.get('/teachers');
        return response.data || [];
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
        return [];
      }
    }
  });

  // Subscribe to real-time timetable updates
  useWebSocket(
    undefined,
    undefined,
    undefined,
    () => {
      // Refetch timetable when admin updates it
      queryClient.invalidateQueries({ queryKey: ['studentTimetable'] });
    }
  );

  // Transform timetable data to schedule format
  const schedule = (() => {
    if (!timetableData || !timetableData.entries) {
      console.log('No timetable data or entries:', timetableData);
      // Return empty template for all days
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({
        day,
        entries: []
      }));
    }

    const entries = timetableData.entries || [];
    console.log('Processing entries:', entries);
    
    // Group entries by day
    const grouped: Record<string, any[]> = {};
    entries.forEach((entry: any) => {
      const day = entry.day || 'Unknown';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    });

    console.log('Grouped by day:', grouped);
    console.log('Available subjects:', subjects);
    console.log('Available teachers:', teachers);

    // Sort by period and map to display format
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => ({
      day,
      entries: (grouped[day] || [])
        .sort((a: any, b: any) => (a.period || 0) - (b.period || 0))
        .map((entry: any) => ({
          period: entry.period,
          subject: subjects.find((s: any) => s._id === entry.subjectId)?.name || entry.subject || '',
          teacher: teachers.find((t: any) => t._id === entry.teacherId)?.name || entry.teacher || '',
          time: entry.time || ''
        }))
    }));
  })();

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="student-timetable-page">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground mt-1">View your weekly class schedule (Real-time updates ✨)</p>
        </div>
        <div className="p-6 border rounded-lg text-center text-muted-foreground">
          Loading timetable...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="student-timetable-page">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground mt-1">View your weekly class schedule (Real-time updates ✨)</p>
      </div>

      {schedule.some(day => day.entries.length > 0) ? (
        <TimetableGrid schedule={schedule} />
      ) : (
        <div className="p-6 border rounded-lg text-center text-muted-foreground">
          No timetable set for your class yet. Admin will set it soon!
        </div>
      )}
    </div>
  );
}
