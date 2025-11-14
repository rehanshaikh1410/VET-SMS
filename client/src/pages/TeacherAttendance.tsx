import AttendanceForm from "@/components/AttendanceForm";
import AttendanceReport from "@/components/AttendanceReport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function TeacherAttendance() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'mark' | 'view'>('mark');
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/me');
        return res.data;
      } catch (err) {
        console.error('Failed to fetch current user for attendance page', err);
        return null;
      }
    }
  });

  // Fetch real classes from API
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await api.get('/classes');
        return response.data || [];
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        return [];
      }
    }
  });

  // Fetch real subjects from API
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

  // Filter classes and subjects to those assigned to the current teacher (if user is teacher)
  const filteredClasses = (currentUser && currentUser.role === 'teacher')
    ? classes.filter((c: any) => {
        const ct = c.classTeacher;
        if (!ct) return false;
        let ctId = '';
        if (typeof ct === 'string') ctId = ct;
        else if (ct && (ct._id || ct.id)) ctId = (ct._id || ct.id).toString();
        else ctId = String(ct);
        return ctId === String(currentUser._id);
      })
    : classes;

  const filteredSubjects = (currentUser && currentUser.role === 'teacher')
    ? subjects.filter((s: any) => {
        const t = s.teachers || [];
        if (!Array.isArray(t) || t.length === 0) return false;
        const teacherIds = t.map((x: any) => (x._id || x).toString());
        return teacherIds.includes(String(currentUser._id));
      })
    : subjects;

  // Further narrow subjects to those assigned to the selected class (if any).
  // We'll prefer subjects from the class timetable (entries.subjectId) because subjects may not
  // always have their `classes` array populated. If no timetable exists or no matches, fall back
  // to the subject.classes relationship.
  // (If selectedClass is empty, show all filteredSubjects.)
  
  // Note: we'll fetch timetable for the selected class down below (after students query).
  // For now declare a placeholder; it will be computed after timetable is available.
  let subjectsForSelectedClass: any[] = filteredSubjects;

  // Fetch students for selected class
  const { data: students = [] } = useQuery({
    queryKey: ['classStudents', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await api.get(`/attendance/class/${selectedClass}`);
        const classAttendance = response.data || [];
        
        // Transform attendance data to student list format
        return classAttendance.map((item: any) => ({
          id: item.studentId || item._id,
          name: item.name,
          rollNumber: item.rollNumber || 'N/A'
        }));
      } catch (err) {
        console.error('Failed to fetch class students:', err);
        return [];
      }
    },
    enabled: !!selectedClass
  });

    // Fetch timetable for selected class to infer which subjects are taught in that class
    const { data: timetableForClass = null } = useQuery({
      queryKey: ['timetable', selectedClass],
      queryFn: async () => {
        if (!selectedClass) return null;
        try {
          const res = await api.get(`/timetables?classId=${selectedClass}`);
          return (res.data && res.data.length > 0) ? res.data[0] : null;
        } catch (err) {
          console.error('Failed to fetch timetable for class:', err);
          return null;
        }
      },
      enabled: !!selectedClass
    });

    // Now compute subjectsForSelectedClass using timetable entries first, then fallback to subject.classes
    // IMPORTANT: only derive subjects when a class is selected. If no class selected, the subject list should be empty
    if (selectedClass) {
      if (timetableForClass && Array.isArray(timetableForClass.entries) && timetableForClass.entries.length > 0) {
        const subjectIds = new Set(timetableForClass.entries.map((e: any) => String(e.subjectId)));
        subjectsForSelectedClass = filteredSubjects.filter((s: any) => subjectIds.has(String(s._id || s.id)));
      } else {
        const byClasses = filteredSubjects.filter((s: any) => {
          const cls = s.classes || [];
          if (!Array.isArray(cls) || cls.length === 0) return false;
          const classIds = cls.map((c: any) => (c._id || c).toString());
          return classIds.includes(String(selectedClass));
        });
        subjectsForSelectedClass = byClasses; // do not fall back to all teacher subjects here
      }
    } else {
      subjectsForSelectedClass = [];
    }

    // Debug logs to help diagnose missing subjects in dropdown (remove in production)
    useEffect(() => {
      // eslint-disable-next-line no-console
      console.log('TeacherAttendance debug:', {
        selectedClass,
        filteredSubjectsCount: filteredSubjects.length,
        subjectsForSelectedClassCount: subjectsForSelectedClass.length,
        timetableForClass
      });
    }, [selectedClass, subjects, timetableForClass]);

  // Subscribe to real-time updates for classes, subjects, and students
  useWebSocket(
    undefined,
    (attendanceUpdate) => {
      // Refetch report data when attendance is updated
      console.log('📨 Attendance update received in TeacherAttendance:', attendanceUpdate);
      queryClient.invalidateQueries({ queryKey: ['attendanceReport', selectedClass] });
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedClass] });
    },
    undefined,
    () => {
      // Refetch classes and subjects when timetable updates (which might affect class/subject data)
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClass] });
    }
  );

  // Set default class on first load
  useEffect(() => {
    if (filteredClasses.length > 0 && !selectedClass) {
      setSelectedClass(filteredClasses[0]._id || filteredClasses[0].id);
    }
  }, [classes, selectedClass]);

  // Update selectedSubject whenever the available subject list for the chosen class changes
  useEffect(() => {
    if (subjectsForSelectedClass.length > 0) {
      // if current selectedSubject is not in the available list, pick the first
      const exists = subjectsForSelectedClass.some((s: any) => (s._id || s.id) === selectedSubject);
      if (!selectedSubject || !exists) {
        setSelectedSubject(subjectsForSelectedClass[0]._id || subjectsForSelectedClass[0].id);
      }
    } else {
      // no subjects available for this class -> clear the subject selection
      setSelectedSubject('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, timetableForClass, subjects]);

  return (
    <div className="space-y-6" data-testid="teacher-attendance-page">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground mt-1">Mark and manage student attendance (Real-time updates ✨)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'mark' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('mark')}
          className="px-4 py-2 rounded-none border-b-2"
        >
          Mark Attendance
        </Button>
        <Button
          variant={activeTab === 'view' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('view')}
          className="px-4 py-2 rounded-none border-b-2"
        >
          View Reports
        </Button>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <>
          <div className="flex gap-4 flex-wrap">
            <div className="w-64 space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((cls: any) => (
                      <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>
                        {cls.name}{cls.grade ? ` (Div ${cls.grade})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-64 space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedClass ? (
                    subjectsForSelectedClass.length > 0 ? (
                      subjectsForSelectedClass.map((subject: any) => (
                        <SelectItem key={subject._id || subject.id} value={subject._id || subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No subjects available for this class</SelectItem>
                    )
                  ) : (
                    <SelectItem value="none" disabled>Select a class first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && students.length > 0 ? (
            <AttendanceForm
              students={students}
              classId={selectedClass}
              subjectId={selectedSubject}
              onViewAttendance={() => setActiveTab('view')}
            />
          ) : (
            <div className="p-6 border rounded-lg text-center text-muted-foreground">
              {selectedClass ? 'Loading students...' : 'Please select a class to mark attendance'}
            </div>
          )}
        </>
      )}

      {/* View Reports Tab */}
      {activeTab === 'view' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Class for Report</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class-report">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((cls: any) => (
                      <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>
                        {cls.name}{cls.grade ? ` (Div ${cls.grade})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                <SelectTrigger data-testid="select-subject-report">
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedClass ? (
                    subjectsForSelectedClass.length > 0 ? (
                      subjectsForSelectedClass.map((subject: any) => (
                        <SelectItem key={subject._id || subject.id} value={subject._id || subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No subjects available</SelectItem>
                    )
                  ) : (
                    <SelectItem value="none" disabled>Select a class first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && (
            <AttendanceReport
              classId={selectedClass}
              className={filteredClasses.find((c: any) => (c._id || c.id) === selectedClass)?.name || 'Class'}
              subjectId={selectedSubject}
            />
          )}
        </>
      )}
    </div>
  );
}
