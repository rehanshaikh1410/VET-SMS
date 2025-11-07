import TimetableGrid from "@/components/TimetableGrid";

export default function TeacherTimetable() {
  const schedule = [
    {
      day: 'Monday',
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'You - Class 10-A', time: '8:00 - 8:45' },
        { period: 3, subject: 'Mathematics', teacher: 'You - Class 10-B', time: '9:40 - 10:25' },
        { period: 5, subject: 'Mathematics', teacher: 'You - Class 9-A', time: '11:30 - 12:15' },
      ]
    },
    {
      day: 'Tuesday',
      entries: [
        { period: 2, subject: 'Mathematics', teacher: 'You - Class 10-A', time: '8:50 - 9:35' },
        { period: 4, subject: 'Mathematics', teacher: 'You - Class 9-A', time: '10:45 - 11:30' },
      ]
    },
    {
      day: 'Wednesday',
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'You - Class 10-B', time: '8:00 - 8:45' },
        { period: 3, subject: 'Mathematics', teacher: 'You - Class 10-A', time: '9:40 - 10:25' },
        { period: 5, subject: 'Mathematics', teacher: 'You - Class 9-A', time: '11:30 - 12:15' },
      ]
    }
  ];

  return (
    <div className="space-y-6" data-testid="teacher-timetable-page">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground mt-1">View your weekly teaching schedule</p>
      </div>

      <TimetableGrid schedule={schedule} />
    </div>
  );
}
