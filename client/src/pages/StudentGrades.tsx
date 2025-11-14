import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable, { Column } from "@/components/DataTable";
import { useQuery } from '@tanstack/react-query';
import { quizApi } from '@/lib/quizApi';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function StudentGrades() {
  const columns: Column[] = [
    { key: 'quiz', label: 'Quiz' },
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date Submitted' },
    { key: 'score', label: 'Score' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' }
  ];

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  const { data: submissions = [], isLoading, isError } = useQuery({
    queryKey: ['studentSubmissions'],
    queryFn: async () => {
      try {
        const data = await quizApi.getStudentSubmissions();
        return data;
      } catch (err) {
        return [];
      }
    }
  });

  useEffect(() => {
    if (isError) {
      toast({ title: 'Error', description: 'Failed to load submissions', variant: 'destructive' });
    }
  }, [isError, toast]);

  // Refresh submissions when a quiz is submitted (real-time)
  useWebSocket(
    undefined,
    undefined,
    (quizUpdate) => {
      // quizUpdate expected shape: { type: 'quiz_submitted', data: { quizId, studentId, score } }
      queryClient.invalidateQueries({ queryKey: ['studentSubmissions'] });
    },
    undefined
  );

  // Map submissions into table rows
  const rows = (Array.isArray(submissions) ? submissions : []).map((s: any) => ({
    id: s._id,
    quiz: s.quizId?.title || '—',
    subject: s.quizId?.subjectName || '-',
    date: new Date(s.submittedAt).toLocaleDateString(),
    score: s.score ?? '-',
    totalMarks: s.totalMarks ?? '-',
    percentage: s.totalMarks ? `${Math.round((s.score / s.totalMarks) * 100)}%` : '-'
  }));

  // Calculate analytics from submissions
  const calculateAnalytics = () => {
    const validSubmissions = (Array.isArray(submissions) ? submissions : []).filter(
      (s: any) => typeof s.score === 'number' && typeof s.totalMarks === 'number' && s.totalMarks > 0
    );

    if (validSubmissions.length === 0) {
      return {
        overallAverage: 0,
        highestScore: null,
        lowestScore: null,
        subjectPerformance: []
      };
    }

    // Overall average percentage
    const totalPoints = validSubmissions.reduce((sum: number, s: any) => sum + s.score, 0);
    const totalPossible = validSubmissions.reduce((sum: number, s: any) => sum + s.totalMarks, 0);
    const overallAverage = totalPossible > 0 ? Math.round((totalPoints / totalPossible) * 100) : 0;

    // Highest and lowest scores
    const scores = validSubmissions.map((s: any) => Math.round((s.score / s.totalMarks) * 100));
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Subject-wise performance
    const bySubject = new Map<string, { total: number; possible: number; count: number; quizzes: string[] }>();
    validSubmissions.forEach((s: any) => {
      const subject = s.quizId?.subjectName || s.quizId?.subject || 'Unknown';
      const quiz = s.quizId?.title || 'Quiz';
      if (!bySubject.has(subject)) {
        bySubject.set(subject, { total: 0, possible: 0, count: 0, quizzes: [] });
      }
      const entry = bySubject.get(subject)!;
      entry.total += s.score;
      entry.possible += s.totalMarks;
      entry.count += 1;
      if (!entry.quizzes.includes(quiz)) {
        entry.quizzes.push(quiz);
      }
    });

    const subjectPerformance = Array.from(bySubject.entries()).map(([subject, data]) => ({
      name: subject,
      score: data.possible > 0 ? Math.round((data.total / data.possible) * 100) : 0,
      quizCount: data.quizzes.length
    }));

    return {
      overallAverage,
      highestScore: scores.length > 0 ? highestScore : null,
      lowestScore: scores.length > 0 ? lowestScore : null,
      subjectPerformance
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="space-y-6" data-testid="student-grades-page">
      <div>
        <h1 className="text-3xl font-bold">My Grades</h1>
        <p className="text-muted-foreground mt-1">View your quiz results and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
          <p className="text-3xl font-bold text-primary">{analytics.overallAverage}%</p>
          <Badge className="mt-2 bg-green-500">{analytics.overallAverage >= 75 ? 'Excellent' : analytics.overallAverage >= 60 ? 'Good' : 'Need Improvement'}</Badge>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Quizzes Completed</p>
          <p className="text-3xl font-bold">{rows.length}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Highest Score</p>
          <p className="text-3xl font-bold">{analytics.highestScore !== null ? `${analytics.highestScore}%` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">—</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Lowest Score</p>
          <p className="text-3xl font-bold">{analytics.lowestScore !== null ? `${analytics.lowestScore}%` : '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">—</p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quiz History</h2>
        <DataTable
          columns={columns}
          data={rows}
          searchable={true}
          onView={(row) => {
            // Find the quiz ID from submissions
            const submission = (Array.isArray(submissions) ? submissions : []).find(
              (s: any) => s._id === row.id
            );
            if (submission?.quizId?._id) {
              // Navigate to student quizzes page - will pass quizId via state if needed
              navigate('/student/quizzes', { replace: false });
              // Store the quiz ID in session storage to view results
              sessionStorage.setItem('viewQuizResultId', submission.quizId._id);
            }
          }}
        />
      </div>
    </div>
  );
}
