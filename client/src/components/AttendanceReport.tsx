import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Filter, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import api from "@/lib/api";

interface AttendanceReportProps {
  classId: string;
  className: string;
  subjectId?: string;
}

interface AttendanceRecord {
  date: string | Date;
  status: string;
  subjectName?: string;
  period?: number;
}

interface Student {
  studentId: string;
  name: string;
  rollNumber: string;
  attendance: AttendanceRecord[];
}

// Helper function to safely format dates
const formatDate = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return 'N/A';
  try {
    // Handle ISO string dates
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    return 'Invalid Date';
  }
};

export default function AttendanceReport({ classId, className, subjectId }: AttendanceReportProps) {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'date' | 'week' | 'month'>('date');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch attendance report data with polling for real-time updates
  const { data: reportData = null, isLoading, refetch } = useQuery({
    queryKey: ['attendanceReport', classId, subjectId, filterType, startDate, endDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('filterType', filterType);

        // Only send dates if using 'date' filter type
        if (filterType === 'date' && startDate && endDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }

        // Include subject filter when provided
        if (subjectId) params.append('subjectId', subjectId);

        const response = await api.get(`/attendance/report/${classId}?${params.toString()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        console.log('📊 Attendance report data fetched:', response.data);
        return response.data;
      } catch (err) {
        console.error('Failed to fetch attendance report:', err);
        return null;
      }
    },
    enabled: !!classId,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 2000, // Auto-refetch every 2 seconds for real-time updates
    refetchIntervalInBackground: false // Only refetch when tab is active
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Subscribe to real-time attendance updates via WebSocket
  useWebSocket(
    undefined,
    (attendanceUpdate) => {
      console.log('📨 Attendance update received in report:', attendanceUpdate);
      // Immediately and forcefully refetch the report data when attendance is updated
      console.log('🔄 Forcing immediate refetch of attendance report...');
      setTimeout(() => {
        refetch();
      }, 100); // Small delay to ensure server has persisted the data
    },
    undefined,
    undefined
  );

  // Calculate attendance statistics
  // Calculate attendance statistics based on displayed students (per-student summary, not per-record)
  const stats = useMemo(() => {
    if (!reportData || !reportData.students) return null;

    let presentCount = 0;
    let absentCount = 0;

    // Count students based on their overall status for this subject/date combo
    reportData.students.forEach((student: Student) => {
      if (student.attendance.length === 0) {
        return; // No records = skip
      }
      
      // If student has any 'Present' record, count as Present; otherwise Absent
      const hasPresent = student.attendance.some((r: AttendanceRecord) => r.status === 'Present');
      if (hasPresent) {
        presentCount++;
      } else {
        absentCount++;
      }
    });

    const totalRecords = presentCount + absentCount;
    const percentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return { presentCount, absentCount, totalRecords, percentage };
  }, [reportData]);

  // Export as CSV
  const handleExport = () => {
    if (!reportData || !reportData.students) return;

    let csv = 'Roll Number,Name,Status\n';

    reportData.students.forEach((student: Student) => {
      // Determine overall status
      const hasPresent = student.attendance.some((r: AttendanceRecord) => r.status === 'Present');
      const hasAbsent = student.attendance.some((r: AttendanceRecord) => r.status === 'Absent');
      
      let status = 'No Records';
      if (student.attendance.length === 0) {
        status = 'No Records';
      } else if (hasPresent) {
        status = 'Present';
      } else if (hasAbsent) {
        status = 'Absent';
      }

      csv += `${student.rollNumber},"${student.name}",${status}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${className}-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading attendance report...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance Report</h2>
        <p className="text-muted-foreground mt-1">View and manage attendance records for {className}</p>
      </div>

      {/* Filter Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Filter Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Filter Type</Label>
            <select
              value={filterType}
                onChange={(e) => {
                  const newFilterType = e.target.value as 'date' | 'week' | 'month';
                  setFilterType(newFilterType);
                  // Reset dates based on filter type
                  if (newFilterType === 'month') {
                    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  } else if (newFilterType === 'week') {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - dayOfWeek);
                    startOfWeek.setHours(0, 0, 0, 0);
                    setStartDate(startOfWeek.toISOString().split('T')[0]);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    setEndDate(endOfWeek.toISOString().split('T')[0]);
                  }
                }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="date">Date Range</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={filterType !== 'date'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={filterType !== 'date'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{stats.totalRecords}</p>
          </Card>
          <Card className="p-4 bg-green-50">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
          </Card>
          <Card className="p-4 bg-red-50">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
          </Card>
          <Card className="p-4 bg-blue-50">
            <p className="text-sm text-muted-foreground">Attendance %</p>
            <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
          </Card>
        </div>
      )}

      {/* Export Button */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export as CSV
        </Button>
      </div>

      {/* Attendance Records Table - Simplified View */}
      <Card className="p-6 overflow-x-auto">
        <h3 className="font-semibold mb-4">Attendance Records</h3>
        {reportData?.students && reportData.students.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Roll No.</th>
                <th className="text-left py-2 px-4">Name</th>
                <th className="text-left py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.students.map((student: Student) => {
                // Determine student's overall attendance status
                // If any record has "Present", show Present; otherwise show Absent
                const hasPresent = student.attendance.some((r: AttendanceRecord) => r.status === 'Present');
                const hasAbsent = student.attendance.some((r: AttendanceRecord) => r.status === 'Absent');
                
                let overallStatus = 'No Records';
                if (student.attendance.length === 0) {
                  overallStatus = 'No Records';
                } else if (hasPresent) {
                  overallStatus = 'Present';
                } else if (hasAbsent) {
                  overallStatus = 'Absent';
                }

                return (
                  <tr key={student.studentId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{student.rollNumber}</td>
                    <td className="py-3 px-4">{student.name}</td>
                    <td className="py-3 px-4">
                      {overallStatus === 'Present' ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>
                      ) : overallStatus === 'Absent' ? (
                        <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No Records</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No attendance records found for the selected period
          </div>
        )}
      </Card>
    </div>
  );
}
