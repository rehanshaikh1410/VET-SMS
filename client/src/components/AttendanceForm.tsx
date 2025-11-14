import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Edit2, Check, X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

interface AttendanceFormProps {
  students: Student[];
  classId: string;
  subjectId: string;
  onSubmit?: (attendance: Record<string, 'present' | 'absent'>) => void;
  onViewAttendance?: () => void;
}

export default function AttendanceForm({ students, classId, subjectId, onSubmit, onViewAttendance }: AttendanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>(
    Object.fromEntries(students.map(s => [s.id, 'present']))
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAttendance, setSubmittedAttendance] = useState<Record<string, 'present' | 'absent'> | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [tempEditStatus, setTempEditStatus] = useState<'present' | 'absent'>('present');
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);

  const handleToggle = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, status])));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transform attendance object to API format
      const studentAttendance = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id] === 'present' ? 'Present' : 'Absent'
      }));

      // Send to server with subjectId
      const response = await api.post('/attendance', {
        classId,
        subjectId,
        date,
        studentAttendance
      });

      toast({
        title: "Success",
        description: `Attendance marked for ${studentAttendance.length} students`,
        variant: "default"
      });

      // Store the submitted attendance and show check section
      setSubmittedAttendance(attendance);
      onSubmit?.(attendance);
      console.log('Attendance submitted:', { classId, subjectId, date, attendance, response: response.data });
    } catch (error: any) {
      console.error('Failed to submit attendance:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to mark attendance",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a submitted attendance
  const handleStartEdit = (studentId: string, currentStatus: 'present' | 'absent') => {
    setEditingStudent(studentId);
    setTempEditStatus(currentStatus);
  };

  const handleSaveEdit = async (studentId: string) => {
    setIsUpdatingAttendance(true);
    try {
      const newStatus = tempEditStatus === 'present' ? 'Present' : 'Absent';
      const student = students.find(s => s.id === studentId);
      console.log(`💾 Saving edit for ${student?.name}: ${newStatus}`);

      // Update via the PUT endpoint with date and subjectId
      const response = await api.put(`/attendance/${studentId}`, {
        status: newStatus,
        date,
        subjectId
      });

      console.log('✅ Edit response:', response.data);

      // Update local submitted state immediately
      setSubmittedAttendance(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          [studentId]: tempEditStatus
        };
        console.log('Updated submittedAttendance state:', updated);
        return updated;
      });

      // Also update the original attendance state
      setAttendance(prev => ({
        ...prev,
        [studentId]: tempEditStatus
      }));

      setEditingStudent(null);

      // Force immediate refetch of all attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendanceReport'] }); // Invalidate ALL attendance reports
      queryClient.invalidateQueries({ queryKey: ['attendance'] }); // Invalidate ALL attendance data
      
      // Manually trigger refetch on any active report queries
      const allQueries = queryClient.getQueryCache().getAll();
      allQueries.forEach(query => {
        if (query.queryKey[0] === 'attendanceReport' || query.queryKey[0] === 'attendance') {
          queryClient.refetchQueries({ queryKey: query.queryKey as any });
        }
      });

      toast({
        title: "Success",
        description: `${student?.name} status updated to ${newStatus}`,
        variant: "default"
      });

      console.log('✅ Attendance edit saved and queries invalidated:', { studentId, status: newStatus });
    } catch (error: any) {
      console.error('❌ Failed to update attendance:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update attendance",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = students.length - presentCount;
  const submittedPresentCount = submittedAttendance ? Object.values(submittedAttendance).filter(s => s === 'present').length : 0;
  const submittedAbsentCount = submittedAttendance ? Object.values(submittedAttendance).length - submittedPresentCount : 0;

  const handleFinalSubmit = async () => {
    // Final submit: save all records (edited or not) to ensure data consistency
    setIsUpdatingAttendance(true);
    try {
      if (!submittedAttendance) {
        toast({
          title: "Error",
          description: "No attendance data to submit",
          variant: "destructive"
        });
        return;
      }

      // Get all students that were edited (status changed from original submitted)
      const studentsToUpdate = students.filter(student => {
        const originalStatus = attendance[student.id];
        const currentStatus = submittedAttendance[student.id];
        const hasChanged = originalStatus !== currentStatus;
        if (hasChanged) {
          console.log(`Student ${student.name}: ${originalStatus} → ${currentStatus}`);
        }
        return hasChanged;
      });

      console.log(`Updating ${studentsToUpdate.length} students out of ${students.length}`);

      // Save all edited records to server
      if (studentsToUpdate.length > 0) {
        const updatePromises = studentsToUpdate.map(student => {
          const newStatus = submittedAttendance[student.id] === 'present' ? 'Present' : 'Absent';
          console.log(`Sending PUT for ${student.name}: ${newStatus}`);
          return api.put(`/attendance/${student.id}`, {
            status: newStatus,
            date,
            subjectId
          }).catch(err => {
            console.error(`Failed to update ${student.name}:`, err);
            throw err;
          });
        });

        const results = await Promise.all(updatePromises);
        console.log('All updates completed:', results);
      } else {
        console.log('No changes detected - no updates needed');
      }

      toast({
        title: "Success",
        description: studentsToUpdate.length > 0 
          ? `Updated ${studentsToUpdate.length} student(s) attendance records` 
          : "Attendance finalized (no changes made)",
        variant: "default"
      });

      // Invalidate queries to refresh data across all views
      queryClient.invalidateQueries({ queryKey: ['attendanceReport', classId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', classId] });
      
      // Small delay to allow server to process and broadcast
      setTimeout(() => {
        // Close the check section
        setSubmittedAttendance(null);
        // Reset attendance to be ready for next marking
        setAttendance(Object.fromEntries(students.map(s => [s.id, 'present'])));
      }, 500);
      
      console.log('Final submit completed');
    } catch (error: any) {
      console.error('Failed to finalize attendance:', error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to finalize attendance";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mark Attendance Card */}
      <Card className="p-6" data-testid="attendance-form">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold">Mark Attendance</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10">
                Present: {presentCount}
              </Badge>
              <Badge variant="outline" className="bg-red-500/10">
                Absent: {absentCount}
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label>Date</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border"
                data-testid="input-date"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleMarkAll('present')} 
                data-testid="button-mark-all-present"
                disabled={isSubmitting}
              >
                Mark All Present
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleMarkAll('absent')} 
                data-testid="button-mark-all-absent"
                disabled={isSubmitting}
              >
                Mark All Absent
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 border rounded-md hover-elevate ${
                  attendance[student.id] === 'present' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                }`}
                data-testid={`student-${student.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">Roll: {student.rollNumber}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggle(student.id)}
                    data-testid={`button-toggle-${student.id}`}
                    disabled={isSubmitting}
                    className={attendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {attendance[student.id] === 'present' ? 'Present' : 'Absent'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onViewAttendance}
              data-testid="button-view-attendance"
            >
              View Attendance
            </Button>
            <Button 
              onClick={handleSubmit} 
              data-testid="button-submit-attendance"
              disabled={isSubmitting || students.length === 0 || submittedAttendance !== null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Check Submitted Attendance Section */}
      {submittedAttendance && (
        <Card className="p-6 border-blue-500 bg-blue-50/30" data-testid="check-submitted-attendance">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">✓ Check Submitted Attendance</h2>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-700">
                Date: {new Date(date).toLocaleDateString()}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Review the submitted attendance below. You can edit any student's status if needed, then click "Final Submit" to confirm.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {students.map((student) => {
                const isEditing = editingStudent === student.id;
                const status = submittedAttendance[student.id];

                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 border rounded-md transition-colors ${
                      status === 'present'
                        ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                        : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                    }`}
                    data-testid={`submitted-student-${student.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">Roll: {student.rollNumber}</p>
                    </div>

                    {isEditing ? (
                      // Edit mode
                      <div className="flex gap-2 items-center">
                        <select
                          value={tempEditStatus}
                          onChange={(e) => setTempEditStatus(e.target.value as 'present' | 'absent')}
                          className="px-3 py-2 border rounded-md text-sm"
                          data-testid={`edit-select-${student.id}`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleSaveEdit(student.id)}
                          disabled={isUpdatingAttendance}
                          data-testid={`save-edit-${student.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdatingAttendance}
                          data-testid={`cancel-edit-${student.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex gap-2 items-center">
                        <Badge
                          variant={status === 'present' ? 'default' : 'destructive'}
                          className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(student.id, status)}
                          disabled={isUpdatingAttendance}
                          data-testid={`edit-button-${student.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-green-500/10">
                  Present: {submittedPresentCount}
                </Badge>
                <Badge variant="outline" className="bg-red-500/10">
                  Absent: {submittedAbsentCount}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSubmittedAttendance(null)}
                  data-testid="button-go-back"
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-final-submit"
                  disabled={isUpdatingAttendance}
                >
                  {isUpdatingAttendance ? 'Finalizing...' : '✓ Final Submit'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
