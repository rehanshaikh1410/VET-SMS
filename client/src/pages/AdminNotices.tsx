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

export default function AdminNotices() {
  const [showForm, setShowForm] = useState(false);

  const notices = [
    { title: "Annual Sports Day", content: "The annual sports day will be held on December 15th. All students are requested to participate actively.", postedBy: "Principal", timestamp: "2 hours ago", priority: "high" as const },
    { title: "Parent-Teacher Meeting", content: "PTM scheduled for next Saturday from 9 AM to 2 PM. Parents are requested to meet respective class teachers.", postedBy: "Admin", timestamp: "1 day ago", priority: "medium" as const },
    { title: "Library Reopening", content: "School library will reopen from Monday with extended hours till 6 PM.", postedBy: "Librarian", timestamp: "2 days ago", priority: "low" as const },
    { title: "Exam Schedule Released", content: "Final exam schedule has been published. Check your class notice boards for details.", postedBy: "Admin", timestamp: "3 days ago", priority: "urgent" as const },
  ];

  return (
    <div className="space-y-6" data-testid="admin-notices-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Notices</h1>
          <p className="text-muted-foreground mt-1">Post and manage school-wide notices</p>
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
            <DialogTitle>Post New Notice</DialogTitle>
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
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select defaultValue="all">
                <SelectTrigger data-testid="select-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
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
