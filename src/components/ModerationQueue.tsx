import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Eye,
  Clock,
  User,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { 
  useModerationQueue, 
  useApproveContent, 
  useRejectContent, 
  useEscalateContent 
} from '@/hooks/useModeration';
import { 
  MODERATION_FLAG_ICONS, 
  MODERATION_FLAG_COLORS, 
  MODERATION_SEVERITY_COLORS,
  MODERATION_STATUS_COLORS,
  CONTENT_TYPE_ICONS 
} from '@/types';
import type { ModerationQueue as ModerationQueueType, ModerationFlag } from '@/types';
import { cn } from '@/lib/utils';

interface ModerationQueueProps {
  className?: string;
}

export function ModerationQueue({ className }: ModerationQueueProps) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged' | 'escalated'>('all');
  
  const { 
    data: queue, 
    isLoading, 
    error 
  } = useModerationQueue(page, 20);
  
  const approveContent = useApproveContent();
  const rejectContent = useRejectContent();
  const escalateContent = useEscalateContent();

  const handleApprove = async (contentId: string) => {
    try {
      await approveContent.mutateAsync(contentId);
    } catch (error) {
      console.error('Failed to approve content:', error);
    }
  };

  const handleReject = async (contentId: string) => {
    try {
      await rejectContent.mutateAsync({
        contentId,
        reason: 'Content violates community guidelines',
        details: 'This content has been flagged for review and rejected.'
      });
    } catch (error) {
      console.error('Failed to reject content:', error);
    }
  };

  const handleEscalate = async (contentId: string) => {
    try {
      await escalateContent.mutateAsync({
        contentId,
        reason: 'Requires human review',
        details: 'This content has been escalated for manual review.'
      });
    } catch (error) {
      console.error('Failed to escalate content:', error);
    }
  };

  const filteredItems = queue?.items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  }) || [];

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Failed to load moderation queue</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Moderation Queue</h2>
          <Badge variant="outline">{queue?.total || 0}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'flagged' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('flagged')}
        >
          Flagged
        </Button>
        <Button
          variant={filter === 'escalated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('escalated')}
        >
          Escalated
        </Button>
      </div>

      {/* Queue Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No items in moderation queue</p>
            <p className="text-sm text-muted-foreground mt-1">
              Content will appear here when it needs moderation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ModerationQueueItem
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onEscalate={handleEscalate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {queue && queue.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(prev => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4 mr-2" />
            )}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

interface ModerationQueueItemProps {
  item: ModerationQueueType;
  onApprove: (contentId: string) => void;
  onReject: (contentId: string) => void;
  onEscalate: (contentId: string) => void;
}

function ModerationQueueItem({ 
  item, 
  onApprove, 
  onReject, 
  onEscalate 
}: ModerationQueueItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getHighestSeverity = (flags: ModerationFlag[]) => {
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const highest = flags.reduce((acc, flag) => {
      const currentIndex = severities.indexOf(flag.severity);
      const accIndex = severities.indexOf(acc);
      return currentIndex > accIndex ? flag.severity : acc;
    }, 'low' as const);
    return highest;
  };

  const highestSeverity = getHighestSeverity(item.flags);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {CONTENT_TYPE_ICONS[item.contentType]}
              </span>
              <div>
                <h3 className="font-semibold text-sm">
                  {item.content.title || 'Untitled Content'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{item.content.author}</span>
                  <span>•</span>
                  <span>{formatTime(item.submittedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  MODERATION_STATUS_COLORS[item.status]
                )}
              >
                {item.status}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  MODERATION_SEVERITY_COLORS[highestSeverity]
                )}
              >
                {highestSeverity}
              </Badge>
            </div>
          </div>

          {/* Content Preview */}
          <div className="text-sm text-muted-foreground">
            {item.content.description || item.content.text || 'No description available'}
          </div>

          {/* Flags */}
          {item.flags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.flags.slice(0, 3).map((flag, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    MODERATION_FLAG_COLORS[flag.type]
                  )}
                >
                  <span className="mr-1">
                    {MODERATION_FLAG_ICONS[flag.type]}
                  </span>
                  {flag.type.replace('_', ' ')}
                </Badge>
              ))}
              {item.flags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.flags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {isExpanded ? 'Hide' : 'View'} Details
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEscalate(item.contentId)}
                className="text-orange-600 hover:text-orange-700"
              >
                <Flag className="w-4 h-4 mr-1" />
                Escalate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(item.contentId)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(item.contentId)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs text-muted-foreground">
                <strong>Content ID:</strong> {item.contentId}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Priority:</strong> {item.priority}
              </div>
              {item.estimatedTime && (
                <div className="text-xs text-muted-foreground">
                  <strong>Estimated Time:</strong> {item.estimatedTime} minutes
                </div>
              )}
              {item.assignedTo && (
                <div className="text-xs text-muted-foreground">
                  <strong>Assigned To:</strong> {item.assignedTo}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
