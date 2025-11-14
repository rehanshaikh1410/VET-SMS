import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

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
  onEditDay?: (dayName: string) => void;
}

export default function TimetableGrid({ schedule, onEditDay }: TimetableGridProps) {
  return (
    <div className="space-y-4" data-testid="timetable-grid">
      {schedule.map((day) => (
        <Card key={day.day} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg" data-testid={`timetable-day-${day.day.toLowerCase()}`}>{day.day}</h3>
            {onEditDay && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditDay(day.day)}
                data-testid={`button-edit-day-${day.day}`}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
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
