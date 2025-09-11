import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Image, 
  Video, 
  File,
  Trash2,
  Eye
} from 'lucide-react';
import { useMediaUpload, MediaUploadOptions } from '@/hooks/useMediaUpload';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  options: MediaUploadOptions;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function MediaUpload({ 
  onUploadComplete, 
  onUploadError, 
  options, 
  multiple = false, 
  maxFiles = 5,
  className,
  disabled = false
}: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    uploadFile, 
    uploadMultipleFiles, 
    uploadProgress, 
    clearProgress, 
    removeProgressItem,
    isUploading 
  } = useMediaUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    if (disabled) return;

    // Filter files based on category
    const allowedTypes = getAllowedTypes(options.category);
    const validFiles = files.filter(file => 
      allowedTypes.includes(file.type) && 
      file.size <= getMaxFileSize(options.category)
    );

    if (validFiles.length === 0) {
      onUploadError?.('No valid files selected');
      return;
    }

    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles - selectedFiles.length);
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
  }, [options.category, maxFiles, selectedFiles.length, onUploadError]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      if (multiple) {
        const results = await uploadMultipleFiles(selectedFiles, options);
        const successful = results
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value);
        
        onUploadComplete?.(successful);
        setSelectedFiles([]);
      } else {
        const result = await uploadFile(selectedFiles[0], options);
        onUploadComplete?.([result]);
        setSelectedFiles([]);
      }
    } catch (error: any) {
      onUploadError?.(error.message);
    }
  }, [selectedFiles, multiple, options, uploadFile, uploadMultipleFiles, onUploadComplete, onUploadError]);

  const removeFile = useCallback((file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
    removeProgressItem(file);
  }, [removeProgressItem]);

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
    clearProgress();
  }, [clearProgress]);

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressItem = (file: File) => {
    return uploadProgress.find(item => item.file === file);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Media Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              onChange={handleFileInput}
              accept={getAllowedTypes(options.category).join(',')}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-primary hover:underline"
                    disabled={disabled}
                  >
                    browse files
                  </button>
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Max file size: {formatFileSize(getMaxFileSize(options.category))}</p>
                <p>Allowed types: {getAllowedTypes(options.category).join(', ')}</p>
                {multiple && <p>Max files: {maxFiles}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Selected Files ({selectedFiles.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedFiles.map((file, index) => {
              const progressItem = getProgressItem(file);
              const FileIcon = getFileIcon(file);
              
              return (
                <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileIcon className="w-5 h-5 text-muted-foreground" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {progressItem && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {progressItem.status === 'uploading' && 'Uploading...'}
                            {progressItem.status === 'processing' && 'Processing...'}
                            {progressItem.status === 'completed' && 'Completed'}
                            {progressItem.status === 'error' && 'Error'}
                          </span>
                          <span className="text-muted-foreground">
                            {progressItem.progress}%
                          </span>
                        </div>
                        <Progress value={progressItem.progress} className="h-1" />
                        {progressItem.error && (
                          <Alert className="mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription className="text-xs">
                              {progressItem.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {progressItem?.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {progressItem?.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="min-w-32"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getAllowedTypes(category: string): string[] {
  const typeMap: Record<string, string[]> = {
    profile_avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    quest_image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    quest_video: ['video/mp4', 'video/webm', 'video/ogg'],
    submission_photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    submission_video: ['video/mp4', 'video/webm', 'video/ogg'],
    submission_document: ['application/pdf', 'text/plain'],
    category_icon: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    badge_image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    general: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'],
  };
  
  return typeMap[category] || typeMap.general;
}

function getMaxFileSize(category: string): number {
  const sizeMap: Record<string, number> = {
    profile_avatar: 5 * 1024 * 1024, // 5MB
    quest_image: 10 * 1024 * 1024, // 10MB
    quest_video: 100 * 1024 * 1024, // 100MB
    submission_photo: 15 * 1024 * 1024, // 15MB
    submission_video: 200 * 1024 * 1024, // 200MB
    submission_document: 20 * 1024 * 1024, // 20MB
    category_icon: 2 * 1024 * 1024, // 2MB
    badge_image: 2 * 1024 * 1024, // 2MB
    general: 50 * 1024 * 1024, // 50MB
  };
  
  return sizeMap[category] || sizeMap.general;
}
