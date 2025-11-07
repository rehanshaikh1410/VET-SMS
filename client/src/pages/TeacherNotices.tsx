import { useState } from "react";
import NoticeCard from "@/components/NoticeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeacherNotices() {
  const [showForm, setShowForm] = useState(false);

  const notices = [
    { title: "Homework Assignment", content: "Complete exercises 1-10 from Chapter 5 by Friday.", postedBy: "You", timestamp: "2 hours ago", priority: "high" as const },
    { title: "Quiz Next Week", content: "Algebra quiz scheduled for next Monday. Prepare topics from chapters 4 and 5.", postedBy: "You", timestamp: "1 day ago", priority: "urgent" as const },
    { title: "Class Cancelled", content: "Today's class is cancelled due to teacher training session.", postedBy: "You", timestamp: "2 days ago", priority: "medium" as const },
  ];

  return (
    <div className="space-y-6" data-testid="teacher-notices-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Notices</h1>
          <p className="text-muted-foreground mt-1">Post notices and homework for your classes</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-post-notice">
          <Plus className="h-4 w-4 mr-2" />
          Post Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {notices.map((notice, idx) => (
          <NoticeCard key={idx} {...notice} />
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Class Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Notice title" data-testid="input-notice-title" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Notice content" data-testid="input-notice-content" />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select defaultValue="class-10a">
                <SelectTrigger data-testid="select-class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class-10a">Class 10-A</SelectItem>
                  <SelectItem value="class-10b">Class 10-B</SelectItem>
                  <SelectItem value="class-9a">Class 9-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => setShowForm(false)} data-testid="button-submit-notice">Post Notice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
