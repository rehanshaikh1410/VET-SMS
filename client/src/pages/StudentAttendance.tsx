import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, BookOpen, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function StudentAttendance() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real attendance data
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['studentAttendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/attendance/student', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const records = response.data;
        // Ensure it's an array
        return Array.isArray(records) ? records : [];
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        return [];
      }
    },
    staleTime: 0, // Consider data immediately stale
    gcTime: 0 // Don't cache the data
  });

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Subscribe to real-time attendance updates
  useWebSocket(
    undefined,
    (attendanceUpdate) => {
      // Refetch attendance when teacher marks it
      queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
    },
    undefined,
    undefined
  );

  // Ensure attendanceRecords is an array before filtering
  const recordsArray = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  
  // Filter out old records without subject IDs (deprecated data)
  const validRecords = recordsArray.filter((r: any) => r.subjectName && r.subjectName !== 'General' || (r.subjectId && r.status));
  
  // Calculate attendance statistics using valid records only
  const presentCount = validRecords.filter((r: any) => r.status === 'Present').length;
  const absentCount = validRecords.filter((r: any) => r.status === 'Absent').length;
  const totalDays = validRecords.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  // Get attendance for selected date, deduplicate by period+subject, and sort by period
  const rawSelected = validRecords.filter((r: any) => {
    const recordDate = new Date(r.date).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  // Deduplicate entries that may appear multiple times for same period/subject.
  // Key by period + subjectId (or subjectName) and prefer a 'Present' record when duplicates exist.
  const dedupMap = new Map<string, any>();
  for (const rec of rawSelected) {
    const key = `${rec.period || 1}-${rec.subjectId || rec.subjectName || 'unknown'}`;
    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, rec);
    } else {
      // Prefer Present over Absent/Not Marked. If statuses are same, keep the more recent date.
      if (rec.status === 'Present' && existing.status !== 'Present') {
        dedupMap.set(key, rec);
      } else if (rec.status === existing.status) {
        try {
          const existingTime = new Date(existing.date).getTime();
          const recTime = new Date(rec.date).getTime();
          if (!isNaN(recTime) && recTime > existingTime) {
            dedupMap.set(key, rec);
          }
        } catch (e) {
          // ignore parse errors and keep existing
        }
      }
    }
  }

  let selectedDateAttendance = Array.from(dedupMap.values()).sort((a: any, b: any) =>
    (a.period || 1) - (b.period || 1)
  );

  // Helper function to get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Get date information
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const weekNumber = getWeekNumber(selectedDateObj);
  const dateFormatted = selectedDateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Navigate to previous date
  const goToPreviousDate = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };

  // Navigate to next date
  const goToNextDate = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  // Get unique dates for date picker (using valid records only)
  const uniqueDates = Array.from(new Set(
    validRecords.map((r: any) => new Date(r.date).toISOString().split('T')[0])
  )).sort().reverse();

  if (isLoading) {
    return <div className="space-y-6">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6" data-testid="student-attendance-page">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">My Attendance</h1>
            <p className="text-muted-foreground mt-1">Track your attendance record</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Overall Attendance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">{attendancePercentage}%</span>
            </div>
            <Progress value={attendancePercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">{presentCount} days present out of {totalDays}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Present</span>
              <span className="font-semibold">{presentCount}</span>
            </div>
            <Progress value={Math.min(presentCount * 10, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">Total marked: {totalDays}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">Absences</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Absent</span>
              <span className="font-semibold text-red-600">{absentCount}</span>
            </div>
            <Progress value={Math.min(absentCount * 10, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">Out of {totalDays} records</p>
          </div>
        </Card>
      </div>

      {/* Enhanced View Attendance Section */}
      <Card className="p-6" data-testid="view-attendance-section">
        <div className="space-y-6">
          {/* Date Selection with Calendar */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">View Attendance</h3>
            
            {/* Date Picker Input */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              {/* Date Picker Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Pick
                </button>
                
                {showDatePicker && uniqueDates.length > 0 && (
                  <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto min-w-48">
                    {uniqueDates.map((date) => {
                      const dateObj = new Date(date + 'T00:00:00');
                      const dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const dayDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setShowDatePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                            selectedDate === date ? 'bg-blue-100 font-semibold' : ''
                          }`}
                        >
                          {dayDisplay} - {dateDisplay}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Info Header */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <div className="space-y-1">
              <h4 className="text-lg font-semibold text-gray-800">{dateFormatted}</h4>
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="font-medium">{dayName}</span>
                <span>• Week {weekNumber}</span>
              </div>
            </div>
          </div>

          {/* Attendance Details for Selected Date */}
          {selectedDateAttendance.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Attendance Details</h4>
              {selectedDateAttendance.map((record: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  data-testid={`attendance-detail-${idx}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Period Info */}
                    <div className="flex items-center gap-2 min-w-fit">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="font-semibold text-gray-800">Period {record.period || '1'}</p>
                      </div>
                    </div>

                    {/* Subject Info */}
                    <div className="flex items-center gap-2 flex-1">
                      <BookOpen className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Subject</p>
                        <p className="font-medium text-gray-800">{record.subjectName || 'General'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                      {record.status === 'Present' ? 'Marked' : 'Not Marked'}
                    </span>
                    <Badge
                      variant={
                        record.status === 'Present'
                          ? 'default'
                          : record.status === 'Absent'
                          ? 'destructive'
                          : 'outline'
                      }
                      className={`${
                        record.status === 'Present' ? 'bg-green-500 hover:bg-green-600' : ''
                      }`}
                    >
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No attendance records for this date</p>
              <p className="text-sm text-gray-400 mt-1">Select a different date or check back later</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={goToPreviousDate}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Day
            </button>
            <button
              onClick={goToNextDate}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center gap-2 ml-auto"
            >
              Next Day
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

