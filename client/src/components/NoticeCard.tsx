import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoticeCardProps {
  _id: string;
  title: string;
  content: string;
  postedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  audience: 'all' | 'teachers' | 'students';
  canEdit?: boolean;
  canDelete?: boolean;
  currentUserId?: string;
  onEdit?: (notice: NoticeCardProps) => void;
  onDelete?: (noticeId: string) => void;
}

const priorityConfig = {
  low: { color: 'bg-muted', borderColor: 'border-l-muted' },
  medium: { color: 'bg-primary', borderColor: 'border-l-primary' },
  high: { color: 'bg-chart-3', borderColor: 'border-l-chart-3' },
  urgent: { color: 'bg-destructive', borderColor: 'border-l-destructive' }
};

export default function NoticeCard({ 
  _id,
  title, 
  content, 
  postedBy, 
  createdAt, 
  priority, 
  audience,
  canEdit,
  canDelete,
  currentUserId,
  onEdit,
  onDelete
}: NoticeCardProps) {
  const priorityColors = {
    low: 'border-blue-500/20 bg-blue-500/5',
    medium: 'border-yellow-500/20 bg-yellow-500/5',
    high: 'border-orange-500/20 bg-orange-500/5',
    urgent: 'border-red-500/20 bg-red-500/5'
  };

  const badgeColors = {
    low: 'bg-blue-500/10 text-blue-600',
    medium: 'bg-yellow-500/10 text-yellow-600',
    high: 'bg-orange-500/10 text-orange-600',
    urgent: 'bg-red-500/10 text-red-600'
  };

  // Determine if user can edit/delete this notice
  const isOwnNotice = currentUserId === postedBy._id;
  const showEditDelete = (canEdit || canDelete) && isOwnNotice;

  return (
    <Card 
      className={`p-4 border ${priorityColors[priority]} transition-all hover:shadow-md`} 
      data-testid={`notice-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-full ${badgeColors[priority]} p-2 mt-1 flex-shrink-0`}>
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-base truncate">{title}</h3>
            <Badge 
              variant="secondary" 
              className={`shrink-0 ${badgeColors[priority]} capitalize`}
            >
              {priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{content}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-muted-foreground">
            <span className="font-medium">{postedBy.name}</span>
            <span>•</span>
            <time dateTime={createdAt}>{new Date(createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</time>
            <span>•</span>
            <span className="capitalize">{audience}</span>
          </div>
          
          {/* Edit and Delete buttons - only show for own notices */}
          {showEditDelete && (
            <div className="flex items-center gap-2 mt-4">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.({
                    _id,
                    title,
                    content,
                    postedBy,
                    createdAt,
                    priority,
                    audience
                  })}
                  data-testid={`button-edit-notice-${_id}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this notice?')) {
                      onDelete?.(_id);
                    }
                  }}
                  data-testid={`button-delete-notice-${_id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
