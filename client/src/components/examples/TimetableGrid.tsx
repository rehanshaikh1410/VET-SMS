import TimetableGrid from '../TimetableGrid';

export default function TimetableGridExample() {
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
    }
  ];

  return (
    <div className="p-6">
      <TimetableGrid schedule={schedule} />
    </div>
  );
}
