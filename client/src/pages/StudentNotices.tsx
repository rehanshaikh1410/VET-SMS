import NoticeCard from "@/components/NoticeCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function StudentNotices() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['studentNotices'],
    queryFn: async () => {
      const response = await api.get('/notices');
      return response.data;
    }
  });

  // Subscribe to real-time notice updates
  useWebSocket(
    (newNotice) => {
      // Invalidate and refetch notices when a new one is created
      queryClient.invalidateQueries({ queryKey: ['studentNotices'] });
    }
  );

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter((n: any) => n.priority === filter);

  if (isLoading) {
    return <div className="space-y-6">Loading notices...</div>;
  }

  return (
    <div className="space-y-6" data-testid="student-notices-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="text-muted-foreground mt-1">Stay updated with school and class announcements</p>
        </div>
        
        <div className="w-48 space-y-2">
          <Label>Filter by Priority</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger data-testid="select-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotices.map((notice: any) => (
          <NoticeCard 
            key={notice._id}
            _id={notice._id}
            title={notice.title}
            content={notice.content}
            postedBy={notice.postedBy || { _id: '', name: 'Admin' }}
            createdAt={notice.createdAt}
            priority={notice.priority}
            audience={notice.audience}
          />
        ))}
      </div>
    </div>
  );
}
