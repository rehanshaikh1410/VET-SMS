import TimetableGrid from "@/components/TimetableGrid";

export default function StudentTimetable() {
  const schedule = [
    {
      day: 'Monday',
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'Mr. Smith', time: '8:00 - 8:45' },
        { period: 2, subject: 'English', teacher: 'Ms. Johnson', time: '8:50 - 9:35' },
        { period: 3, subject: 'Physics', teacher: 'Dr. Brown', time: '9:40 - 10:25' },
        { period: 4, subject: 'Chemistry', teacher: 'Ms. Davis', time: '10:45 - 11:30' },
      ]
    },
    {
      day: 'Tuesday',
      entries: [
        { period: 1, subject: 'Biology', teacher: 'Dr. Wilson', time: '8:00 - 8:45' },
        { period: 2, subject: 'History', teacher: 'Mr. Taylor', time: '8:50 - 9:35' },
        { period: 3, subject: 'Computer Science', teacher: 'Ms. Anderson', time: '9:40 - 10:25' },
        { period: 4, subject: 'Physical Education', teacher: 'Coach Lee', time: '10:45 - 11:30' },
      ]
    },
    {
      day: 'Wednesday',
      entries: [
        { period: 1, subject: 'Mathematics', teacher: 'Mr. Smith', time: '8:00 - 8:45' },
        { period: 2, subject: 'English', teacher: 'Ms. Johnson', time: '8:50 - 9:35' },
        { period: 3, subject: 'Physics', teacher: 'Dr. Brown', time: '9:40 - 10:25' },
        { period: 4, subject: 'Chemistry', teacher: 'Ms. Davis', time: '10:45 - 11:30' },
      ]
    }
  ];

  return (
    <div className="space-y-6" data-testid="student-timetable-page">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground mt-1">View your weekly class schedule</p>
      </div>

      <TimetableGrid schedule={schedule} />
    </div>
  );
}
