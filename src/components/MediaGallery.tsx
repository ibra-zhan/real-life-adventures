import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image, 
  Video, 
  File, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { useMediaFiles } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

interface MediaGalleryProps {
  category?: string;
  questId?: string;
  submissionId?: string;
  onMediaSelect?: (media: any) => void;
  onMediaDelete?: (mediaId: string) => void;
  className?: string;
  showActions?: boolean;
}

export function MediaGallery({ 
  category, 
  questId, 
  submissionId, 
  onMediaSelect, 
  onMediaDelete,
  className,
  showActions = true
}: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  
  const { data: mediaData, isLoading, error } = useMediaFiles({
    category,
    questId,
    submissionId,
  });

  const handleMediaClick = (media: any) => {
    setSelectedMedia(media.id);
    onMediaSelect?.(media);
  };

  const handleDownload = (media: any) => {
    if (media.publicUrl) {
      window.open(media.publicUrl, '_blank');
    }
  };

  const handleDelete = (mediaId: string) => {
    onMediaDelete?.(mediaId);
  };

  const getMediaIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return Image;
    if (mimetype.startsWith('video/')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'uploading': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
          <p className="text-muted-foreground">Failed to load media files</p>
        </CardContent>
      </Card>
    );
  }

  if (!mediaData?.files || mediaData.files.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No media files found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Media Files ({mediaData.files.length})</h3>
        {mediaData.total > mediaData.files.length && (
          <Badge variant="outline">
            Showing {mediaData.files.length} of {mediaData.total}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaData.files.map((media) => {
          const MediaIcon = getMediaIcon(media.mimetype);
          const isSelected = selectedMedia === media.id;
          
          return (
            <Card 
              key={media.id} 
              className={cn(
                "group cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => handleMediaClick(media)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Media Preview */}
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    {media.publicUrl ? (
                      media.mimetype.startsWith('image/') ? (
                        <img
                          src={media.publicUrl}
                          alt={media.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : media.mimetype.startsWith('video/') ? (
                        <video
                          src={media.publicUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MediaIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MediaIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(media.status)
                      )} />
                    </div>
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(media);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {showActions && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(media.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Media Info */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={media.originalName}>
                      {media.originalName}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(media.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {media.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(media.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {mediaData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {mediaData.page} of {mediaData.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
