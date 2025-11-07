import { Card } from "@/components/ui/card";

interface TimetableEntry {
  period: number;
  subject: string;
  teacher: string;
  time: string;
}

interface TimetableGridProps {
  schedule: {
    day: string;
    entries: TimetableEntry[];
  }[];
}

export default function TimetableGrid({ schedule }: TimetableGridProps) {
  return (
    <div className="space-y-4" data-testid="timetable-grid">
      {schedule.map((day) => (
        <Card key={day.day} className="p-4">
          <h3 className="font-semibold text-lg mb-4" data-testid={`timetable-day-${day.day.toLowerCase()}`}>{day.day}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {day.entries.map((entry) => (
              <div
                key={entry.period}
                className="border rounded-md p-3 hover-elevate"
                data-testid={`timetable-period-${entry.period}`}
              >
                <div className="text-xs text-muted-foreground mb-1">Period {entry.period} • {entry.time}</div>
                <div className="font-semibold text-sm">{entry.subject}</div>
                <div className="text-xs text-muted-foreground mt-1">{entry.teacher}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
