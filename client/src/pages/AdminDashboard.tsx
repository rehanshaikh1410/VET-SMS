import StatCard from "@/components/StatCard";
import NoticeCard from "@/components/NoticeCard";
import PerformanceChart from "@/components/PerformanceChart";
import { Users, GraduationCap, BookOpen, ClipboardList, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: statsData, isLoading: isLoadingStats, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/stats');
        return data;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    },
    retry: 1
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteNotice = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast({ title: 'Deleted', description: 'Notice deleted' });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err) {
      console.error('Failed to delete notice', err);
      toast({ title: 'Error', description: 'Failed to delete notice', variant: 'destructive' });
    }
  };

  const stats = [
    { 
      title: "Total Students", 
      value: statsData?.counts?.students || 0, 
      icon: GraduationCap, 
      trend: { value: 12, isPositive: true }, 
      iconColor: "bg-blue-500/10" 
    },
    { 
      title: "Total Teachers", 
      value: statsData?.counts?.teachers || 0, 
      icon: Users, 
      iconColor: "bg-green-500/10" 
    },
    { 
      title: "Active Classes", 
      value: statsData?.counts?.classes || 0, 
      icon: BookOpen, 
      trend: { value: 3, isPositive: true }, 
      iconColor: "bg-purple-500/10" 
    },
    { 
      title: "Active Quizzes", 
      value: statsData?.counts?.quizzes || 0, 
      icon: ClipboardList, 
      iconColor: "bg-orange-500/10" 
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="admin-dashboard">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-2">Welcome back! Here's what's happening today.</p>
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mt-4">
            Error loading dashboard data. Please try refreshing the page.
          </div>
        )}
        {isLoadingStats && (
          <div className="text-muted-foreground mt-4">
            Loading dashboard data...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PerformanceChart 
          data={statsData?.performance?.attendance || []} 
          title="Class-wise Attendance %" 
          height={350} 
        />
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Recent Notices</h2>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/notices'}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {(statsData?.notices || []).map((notice: any, idx: number) => (
            <div key={notice._id || idx} className="mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <NoticeCard
                    _id={notice._id || `temp-${idx}`}
                    title={notice.title}
                    content={notice.content}
                    postedBy={notice.postedBy || { _id: '0', name: 'Admin' }}
                    createdAt={notice.createdAt}
                    priority={notice.priority || 'medium'}
                    audience={notice.audience || 'all'}
                  />
                </div>
                <div className="mt-2">
                  <Button variant="ghost" onClick={() => deleteNotice(notice._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
