import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface NoticeCardProps {
  title: string;
  content: string;
  postedBy: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const priorityConfig = {
  low: { color: 'bg-muted', borderColor: 'border-l-muted' },
  medium: { color: 'bg-primary', borderColor: 'border-l-primary' },
  high: { color: 'bg-chart-3', borderColor: 'border-l-chart-3' },
  urgent: { color: 'bg-destructive', borderColor: 'border-l-destructive' }
};

export default function NoticeCard({ title, content, postedBy, timestamp, priority }: NoticeCardProps) {
  return (
    <Card className={`p-4 border-l-4 ${priorityConfig[priority].borderColor}`} data-testid={`notice-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base">{title}</h3>
            <Badge variant="outline" className="text-xs">{priority}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{content}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Posted by {postedBy}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
