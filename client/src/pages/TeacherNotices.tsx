import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
import api from "@/lib/api";

interface Notice {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  audience: 'all' | 'teachers' | 'students';
  postedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Class {
  _id: string;
  name: string;
  grade: number;
}

export default function TeacherNotices() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  
  type FormData = {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    audience: 'all' | 'teachers' | 'students';
  };

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    priority: 'medium',
    audience: 'students'
  });

  // Load notices, classes, and current user on mount
  useEffect(() => {
    loadCurrentUser();
    loadNotices();
    loadClasses();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data } = await api.get<any>('/me');
      setCurrentUserId(data._id);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadNotices = async () => {
    try {
      const { data } = await api.get<Notice[]>('/notices');
      setNotices(data);
    } catch (err) {
      console.error('Load notices failed:', err);
      toast({
        title: "Error",
        description: "Failed to load notices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data } = await api.get<Class[]>('/classes');
      setClasses(data);
      // Set first class as default if available
      if (data.length > 0) {
        setSelectedClass(data[0]._id);
      }
    } catch (err) {
      console.error('Load classes failed:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: "Missing fields",
          description: "Please fill in both title and content.",
          variant: "destructive"
        });
        return;
      }

      if (editingNotice) {
        // Update existing notice
        const { data: updatedNotice } = await api.put<Notice>(`/notices/${editingNotice._id}`, formData);
        setNotices(prev => prev.map(n => n._id === updatedNotice._id ? updatedNotice : n));
        toast({
          title: "Success",
          description: "Notice updated successfully.",
        });
      } else {
        // Create new notice
        const { data: newNotice } = await api.post<Notice>('/notices', formData);
        setNotices(prev => [newNotice, ...prev]);
        toast({
          title: "Success",
          description: "Notice posted successfully.",
        });
      }

      setShowForm(false);
      setEditingNotice(null);
      setFormData({ 
        title: '', 
        content: '', 
        priority: 'medium' as const, 
        audience: 'students' as const 
      });
    } catch (err) {
      console.error(`${editingNotice ? 'Update' : 'Post'} notice failed:`, err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${editingNotice ? 'update' : 'post'} notice. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      audience: notice.audience
    });
    setShowForm(true);
  };

  const handleDelete = async (noticeId: string) => {
    try {
      await api.delete(`/notices/${noticeId}`);
      setNotices(prev => prev.filter(n => n._id !== noticeId));
      toast({
        title: "Success",
        description: "Notice deleted successfully.",
      });
    } catch (err) {
      console.error('Delete notice failed:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete notice. Please try again.",
        variant: "destructive"
      });
    }
  };

  // split notices into "mine" and "others" for clearer UI
  const myNotices = notices.filter(n => n.postedBy && n.postedBy._id === currentUserId);
  const otherNotices = notices.filter(n => !(n.postedBy && n.postedBy._id === currentUserId));

  return (
    <div className="space-y-6" data-testid="teacher-notices-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Notices</h1>
          <p className="text-muted-foreground mt-1">View notices from admin and post notices for your classes</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-post-notice">
          <Plus className="h-4 w-4 mr-2" />
          Post Notice
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No notices yet. Admin notices will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold">My Notices</h2>
            {myNotices.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-2">You haven't posted any notices yet.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                {myNotices.map((notice) => (
                  <NoticeCard
                    key={notice._id}
                    {...notice}
                    currentUserId={currentUserId}
                    canEdit={true}
                    canDelete={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold">Other Notices</h2>
            {otherNotices.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-2">No notices from others.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                {otherNotices.map((notice) => (
                  <NoticeCard
                    key={notice._id}
                    {...notice}
                    currentUserId={currentUserId}
                    canEdit={false}
                    canDelete={false}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog 
        open={showForm} 
        onOpenChange={(open) => {
          if (!open) {
            setFormData({ title: '', content: '', priority: 'medium', audience: 'students' });
            setEditingNotice(null);
          }
          setShowForm(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Post Class Notice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                placeholder="Notice title" 
                data-testid="input-notice-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea 
                placeholder="Notice content" 
                data-testid="input-notice-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
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
              <Label>Audience</Label>
              <Select 
                value={formData.audience}
                onValueChange={(value: 'all' | 'teachers' | 'students') => 
                  setFormData(prev => ({ ...prev, audience: value }))
                }
              >
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
              <Button variant="outline" onClick={() => {
                setShowForm(false);
                setEditingNotice(null);
              }}>Cancel</Button>
              <Button onClick={handleSubmit} data-testid="button-submit-notice">{editingNotice ? 'Update' : 'Post'} Notice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
