import NoticeCard from "@/components/NoticeCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function StudentNotices() {
  const [filter, setFilter] = useState('all');

  const notices = [
    { title: "Assignment Due Tomorrow", content: "Math assignment chapter 5 exercises 1-10 must be submitted by tomorrow.", postedBy: "Mr. Smith", timestamp: "1 hour ago", priority: "urgent" as const },
    { title: "Quiz Next Monday", content: "Algebra quiz scheduled for next Monday. Prepare topics from chapters 4 and 5.", postedBy: "Mr. Smith", timestamp: "3 hours ago", priority: "high" as const },
    { title: "Annual Sports Day", content: "Sports day scheduled for December 15th. Register for your events by Friday.", postedBy: "Principal", timestamp: "1 day ago", priority: "high" as const },
    { title: "Library Hours Extended", content: "School library will now be open till 6 PM on weekdays.", postedBy: "Librarian", timestamp: "2 days ago", priority: "low" as const },
    { title: "Parent-Teacher Meeting", content: "PTM scheduled for next Saturday from 9 AM to 2 PM.", postedBy: "Admin", timestamp: "3 days ago", priority: "medium" as const },
    { title: "Science Project Submission", content: "Science project submissions extended till December 20th.", postedBy: "Dr. Brown", timestamp: "4 days ago", priority: "medium" as const },
  ];

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.priority === filter);

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
        {filteredNotices.map((notice, idx) => (
          <NoticeCard key={idx} {...notice} />
        ))}
      </div>
    </div>
  );
}
