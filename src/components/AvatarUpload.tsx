import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Upload,
  X,
  Crop,
  RotateCw,
  Download,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string | null) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (success: boolean) => void;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  onUploadStart,
  onUploadComplete,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: AvatarUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [rotation, setRotation] = useState(0);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Please select a valid image file (${allowedTypes.map(type => type.split('/')[1]).join(', ')})`;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    return null;
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-enable crop mode for new uploads
    setCropMode(true);
    setRotation(0);
  }, [maxSizeInMB, allowedTypes, toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCropMode(true);
    setRotation(0);
  }, [maxSizeInMB, allowedTypes, toast]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const simulateUploadProgress = (onComplete: () => void) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
        setTimeout(onComplete, 500);
      } else {
        setUploadProgress({
          loaded: progress,
          total: 100,
          percentage: Math.round(progress)
        });
      }
    }, 100);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    onUploadStart?.();

    try {
      // TODO: Replace with actual upload logic
      // const formData = new FormData();
      // formData.append('avatar', selectedFile);
      // const response = await apiClient.uploadFile(formData, 'avatar');

      // Simulate upload with progress
      simulateUploadProgress(() => {
        // Simulate successful upload
        const mockAvatarUrl = URL.createObjectURL(selectedFile);
        onAvatarChange(mockAvatarUrl);

        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been successfully updated.",
        });

        // Clean up
        setSelectedFile(null);
        setPreviewUrl(null);
        setCropMode(false);
        setIsUploading(false);
        setUploadProgress(null);
        onUploadComplete?.(true);
      });

    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });

      setIsUploading(false);
      setUploadProgress(null);
      onUploadComplete?.(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCropMode(false);
    setRotation(0);
    setUploadProgress(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange(null);
    toast({
      title: "Avatar Removed",
      description: "Your profile picture has been removed.",
    });
  };

  const getDisplayAvatar = () => {
    if (previewUrl) return previewUrl;
    if (currentAvatar) return currentAvatar;
    return null;
  };

  const displayAvatar = getDisplayAvatar();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Current/Preview Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className={`w-20 h-20 rounded-full object-cover border-2 border-border ${
                    cropMode ? 'opacity-50' : ''
                  }`}
                  style={{
                    transform: `rotate(${rotation}deg)`
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-bold text-primary border-2 border-border">
                  <Camera className="w-8 h-8" />
                </div>
              )}

              {cropMode && (
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center">
                  <Crop className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Upload a photo to personalize your profile
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Square image, max {maxSizeInMB}MB
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress value={uploadProgress.percentage} className="h-2" />
            </div>
          )}

          {/* Drag & Drop Area */}
          {!selectedFile && !isUploading && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                {allowedTypes.map(type => type.split('/')[1]).join(', ')} up to {maxSizeInMB}MB
              </p>
            </div>
          )}

          {/* File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview Actions */}
          {selectedFile && !isUploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground">
                  ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>

              {/* Crop Controls */}
              {cropMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    Rotate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCropMode(false)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Done Cropping
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Avatar'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Remove Avatar Option */}
          {currentAvatar && !selectedFile && !isUploading && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveAvatar}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Remove Current Avatar
            </Button>
          )}

          {/* Help Text */}
          <div className="bg-blue-50/10 border border-blue-200/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Tips for best results:</p>
                <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1 text-xs">
                  <li>• Use a square image for best results</li>
                  <li>• Make sure your face is clearly visible</li>
                  <li>• Avoid images with text or logos</li>
                  <li>• Good lighting makes a big difference</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}