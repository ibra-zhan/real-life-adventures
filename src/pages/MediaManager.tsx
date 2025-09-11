import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  Image, 
  Video, 
  File,
  BarChart3,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { MediaUpload } from '@/components/MediaUpload';
import { MediaGallery } from '@/components/MediaGallery';
import { useMediaStats } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

export default function MediaManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: stats, isLoading: statsLoading } = useMediaStats();

  const categories = [
    { value: 'all', label: 'All Media', icon: File },
    { value: 'profile_avatar', label: 'Profile Avatars', icon: Image },
    { value: 'quest_image', label: 'Quest Images', icon: Image },
    { value: 'quest_video', label: 'Quest Videos', icon: Video },
    { value: 'submission_photo', label: 'Submission Photos', icon: Image },
    { value: 'submission_video', label: 'Submission Videos', icon: Video },
    { value: 'submission_document', label: 'Documents', icon: File },
    { value: 'category_icon', label: 'Category Icons', icon: Image },
    { value: 'badge_image', label: 'Badge Images', icon: Image },
    { value: 'general', label: 'General', icon: File },
  ];

  const handleMediaSelect = (media: any) => {
    setSelectedMedia(media);
  };

  const handleMediaDelete = (mediaId: string) => {
    // TODO: Implement media deletion
    console.log('Delete media:', mediaId);
  };

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload complete:', files);
    setShowUpload(false);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Media Manager</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.totalFiles || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Files</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.imageFiles || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Images</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.videoFiles || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : formatFileSize(stats?.totalSize || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="quest">Quest Media</TabsTrigger>
                  <TabsTrigger value="submission">Submission</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <MediaUpload
                    options={{ category: 'general' }}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    multiple={true}
                    maxFiles={10}
                  />
                </TabsContent>
                
                <TabsContent value="quest">
                  <MediaUpload
                    options={{ category: 'quest_image' }}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    multiple={true}
                    maxFiles={5}
                  />
                </TabsContent>
                
                <TabsContent value="submission">
                  <MediaUpload
                    options={{ category: 'submission_photo' }}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    multiple={true}
                    maxFiles={5}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Media Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media Library
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MediaGallery
              category={selectedCategory === 'all' ? undefined : selectedCategory}
              onMediaSelect={handleMediaSelect}
              onMediaDelete={handleMediaDelete}
              showActions={true}
            />
          </CardContent>
        </Card>

        {/* Selected Media Details */}
        {selectedMedia && (
          <Card>
            <CardHeader>
              <CardTitle>Media Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  {selectedMedia.publicUrl && selectedMedia.mimetype.startsWith('image/') ? (
                    <img
                      src={selectedMedia.publicUrl}
                      alt={selectedMedia.originalName}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <File className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{selectedMedia.originalName}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedMedia.category.replace('_', ' ')}</Badge>
                      <Badge variant="secondary">{selectedMedia.mimetype}</Badge>
                      <Badge variant="outline">{formatFileSize(selectedMedia.size)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on {new Date(selectedMedia.uploadedAt).toLocaleDateString()}
                    </p>
                    {selectedMedia.publicUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedMedia.publicUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Size
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
