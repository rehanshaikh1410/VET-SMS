import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/DataTable";

export default function AdminReports() {
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('quiz');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateRange, setDateRange] = useState('date');
  const [filterType, setFilterType] = useState<'date'|'week'|'month'>('date');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const res = await api.get('/classes');
        const data = res.data || [];
        // Auto-select first class
        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0]._id);
        }
        return data;
      } catch (err) {
        console.error('Failed to fetch classes', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        const res = await api.get('/subjects');
        const data = res.data || [];
        // Auto-select first subject
        if (data.length > 0 && !selectedSubject) {
          setSelectedSubject(data[0]._id);
        }
        return data;
      } catch (err) {
        console.error('Failed to fetch subjects', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch all quizzes with submissions
  const { data: quizzesData = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['quizzes', selectedClass, selectedSubject],
    queryFn: async () => {
      try {
        const res = await api.get('/quizzes');
        let quizzes = res.data || [];
        
        // Filter by class
        if (selectedClass) {
          quizzes = quizzes.filter((q: any) => {
            const classIds = q.classIds || (q.classId ? [q.classId] : []);
            return classIds.some((cid: any) => {
              const cidStr = typeof cid === 'string' ? cid : cid._id || cid.id;
              return cidStr === selectedClass;
            });
          });
        }
        
        // Filter by subject
        if (selectedSubject) {
          quizzes = quizzes.filter((q: any) => {
            const subId = q.subjectId?._id || q.subjectId;
            return subId === selectedSubject;
          });
        }

        // Fetch submission data for each quiz
        const quizzesWithStats = await Promise.all(
          quizzes.map(async (quiz: any) => {
            try {
              const submissions = await api.get(`/quiz-submissions/quiz/${quiz._id}`);
              const subs = submissions.data || [];
              const avgScore = subs.length > 0 
                ? Math.round((subs.reduce((acc: number, s: any) => acc + s.score, 0) / subs.length / (quiz.totalMarks || 1)) * 100)
                : 0;
              return {
                ...quiz,
                submissionCount: subs.length,
                avgScore,
                submissions: subs,
                studentResults: subs.map((s: any) => ({
                  studentName: s.student?.name || 'Unknown',
                  studentRollNo: s.student?.rollNumber || 'N/A',
                  score: s.score,
                  totalMarks: s.totalMarks,
                  percentage: s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0,
                  submittedAt: new Date(s.submittedAt).toLocaleDateString()
                }))
              };
            } catch (err) {
              return { ...quiz, submissionCount: 0, avgScore: 0, submissions: [], studentResults: [] };
            }
          })
        );

        return quizzesWithStats;
      } catch (err) {
        console.error('Failed to fetch quizzes', err);
        return [];
      }
    },
    staleTime: 0,
    refetchInterval: 5000 // Real-time refresh every 5 seconds
  });

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const res = await api.get('/stats');
        return res.data;
      } catch (err) {
        console.error('Failed to fetch stats', err);
        return {};
      }
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch attendance report for selected class and subject (real-time)
  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendanceReport', selectedClass, selectedSubject],
    enabled: reportType === 'attendance' && !!selectedClass,
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedSubject) params.append('subjectId', selectedSubject);
        if (filterType) params.append('filterType', filterType === 'date' ? 'date' : filterType);
        if (filterType === 'date' && startDate) params.append('startDate', startDate);
        if (filterType === 'date' && endDate) params.append('endDate', endDate);
        const url = `/attendance/report/${selectedClass}${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await api.get(url);
        return res.data;
      } catch (err) {
        console.error('Failed to fetch attendance report', err);
        return null;
      }
    },
    staleTime: 0,
    refetchInterval: reportType === 'attendance' ? 5000 : false // refresh every 5s when attendance view active
  });

  // Export to CSV
  const handleExport = () => {
    if (reportType === 'quiz' && quizzesData.length === 0) {
      toast({ title: 'No Data', description: 'No quizzes to export', variant: 'destructive' });
      return;
    }

    let csvContent = '';
    let filename = '';

    if (reportType === 'quiz') {
      filename = `quiz_report_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'Quiz Title,Class,Subject,Total Marks,Submissions,Average Score (%)\n';
      quizzesData.forEach((quiz: any) => {
        const className = Array.isArray(quiz.classIds)
          ? quiz.classIds.map((cid: any) => classes.find((c: any) => c._id === cid)?.name || cid).join('; ')
          : classes.find((c: any) => c._id === quiz.classId)?.name || 'Unknown';
        const subjectName = quiz.subjectId?.name || 'Unknown';
        csvContent += `"${quiz.title}","${className}","${subjectName}",${quiz.totalMarks || 100},${quiz.submissionCount},${quiz.avgScore}\n`;
      });
    }

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({ title: 'Success', description: `${filename} downloaded` });
  };

  // --- Attendance utilities ---
  const computeTotals = (report: any) => {
    const students = report?.students || [];
    let total = 0;
    let present = 0;
    let absent = 0;
    for (const st of students) {
      const entries = st.attendance || [];
      total += entries.length;
      for (const e of entries) {
        const s = String(e.status || '').toLowerCase();
        if (s === 'present') present++;
        else if (s === 'absent') absent++;
      }
    }
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const flattenAttendanceRecords = (report: any) => {
    const rows: any[] = [];
    const students = report?.students || [];
    for (const st of students) {
      const entries = st.attendance || [];
      for (const e of entries) {
        rows.push({
          rollNumber: st.rollNumber || st.rollNo || '',
          name: st.name || '',
          status: e.status || 'Unknown',
          date: e.date || null,
          subjectId: e.subjectId || null
        });
      }
    }
    // sort by rollNumber
    rows.sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber)));
    return rows;
  };

  const exportAttendanceCSV = (report: any) => {
    if (!report || !report.students) {
      toast({ title: 'No data', description: 'No attendance data to export', variant: 'destructive' });
      return;
    }
    const rows = flattenAttendanceRecords(report);
    let csv = 'Roll Number,Name,Status,Date,Subject\n';
    for (const r of rows) {
      csv += `"${r.rollNumber}","${r.name}","${r.status}","${r.date || ''}","${r.subjectId || ''}"\n`;
    }
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `attendance_report_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Exported', description: 'CSV downloaded' });
  };

  const quizColumns = [
    { key: 'title', label: 'Quiz Title' },
    { key: 'className', label: 'Class' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'submissionCount', label: 'Submissions' },
    { key: 'avgScore', label: 'Avg Score (%)' }
  ];

  // Get unique class names from quizzes
  const getClassNameFromId = (id: string) => {
    const cls = classes.find((c: any) => c._id === id);
    return cls?.name || 'Unknown';
  };

  const getSubjectNameFromId = (id: string) => {
    const subj = subjects.find((s: any) => s._id === id);
    return subj?.name || 'Unknown';
  };

  const quizzesForTable = quizzesData.map((quiz: any) => ({
    ...quiz,
    className: Array.isArray(quiz.classIds)
      ? quiz.classIds.map(getClassNameFromId).join(', ')
      : getClassNameFromId(quiz.classId),
    subjectName: getSubjectNameFromId(quiz.subjectId?._id || quiz.subjectId)
  }));

  return (
    <div className="space-y-6" data-testid="admin-reports-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">View comprehensive reports and analytics across your institution</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger data-testid="select-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz Performance</SelectItem>
                <SelectItem value="attendance">Attendance Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger data-testid="select-class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}{c.grade ? ` (Grade ${c.grade})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger data-testid="select-subject">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s: any) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['quizzes', selectedClass, selectedSubject] })}
              data-testid="button-refresh-stats"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              data-testid="button-export-report"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Dynamic Report Table */}
      {reportType === 'quiz' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Quiz Summary</h3>
            {quizzesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading quizzes...
              </div>
            ) : quizzesForTable.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quizzes found for the selected class and subject
              </div>
            ) : (
              <DataTable 
                columns={quizColumns}
                data={quizzesForTable}
                searchable={true}
                itemsPerPage={10}
                columnRenderers={{
                  'avgScore': (value: number) => `${value}%`
                }}
              />
            )}
          </Card>

          {/* Student Results for Each Quiz */}
          {quizzesData.map((quiz: any) => (
            <Card key={quiz._id} className="p-6">
              <h3 className="font-semibold text-lg mb-4">{quiz.title} - Student Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-sm">Student Name</th>
                      <th className="text-left p-3 font-semibold text-sm">Roll Number</th>
                      <th className="text-left p-3 font-semibold text-sm">Score</th>
                      <th className="text-left p-3 font-semibold text-sm">Percentage</th>
                      <th className="text-left p-3 font-semibold text-sm">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quiz.studentResults && quiz.studentResults.length > 0 ? (
                      quiz.studentResults.map((result: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm font-medium">{result.studentName}</td>
                          <td className="p-3 text-sm">{result.studentRollNo}</td>
                          <td className="p-3 text-sm">
                            <span className="font-semibold">{result.score}/{result.totalMarks}</span>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${result.percentage >= 70 ? 'bg-green-500' : result.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${result.percentage}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-sm">{result.percentage}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{result.submittedAt}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-muted-foreground">
                          No student submissions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Report Table (per-student for selected class & subject) */}
      {reportType === 'attendance' && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Attendance Report</h3>
          <div className="space-y-4">
            {/* Filter Options (match teacher UI) */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <Label>Filter Type</Label>
                  <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Range</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>

                <div>
                  <Label>End Date</Label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>

                <div className="md:col-span-2 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['attendanceReport', selectedClass, selectedSubject] })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={() => exportAttendanceCSV(attendanceReport)}>
                    Export as CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{attendanceReport ? computeTotals(attendanceReport).total : 0}</p>
              </Card>
              <Card className="p-4 bg-green-50">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-700">{attendanceReport ? computeTotals(attendanceReport).present : 0}</p>
              </Card>
              <Card className="p-4 bg-red-50">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-700">{attendanceReport ? computeTotals(attendanceReport).absent : 0}</p>
              </Card>
              <Card className="p-4 bg-blue-50">
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-2xl font-bold text-blue-700">{attendanceReport ? computeTotals(attendanceReport).percentage + '%' : '0%'}</p>
              </Card>
            </div>

            {/* Records table */}
            {attendanceLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
            ) : !attendanceReport || !attendanceReport.students || attendanceReport.students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No attendance records found for the selected class/subject</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-sm">Roll No.</th>
                      <th className="text-left p-3 font-semibold text-sm">Name</th>
                      <th className="text-left p-3 font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flattenAttendanceRecords(attendanceReport).map((rec: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{rec.rollNumber || 'N/A'}</td>
                        <td className="p-3 text-sm font-medium">{rec.name}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : rec.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
