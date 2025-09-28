import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  User,
  Settings,
  Bell,
  Image as ImageIcon,
  FileText,
  Camera
} from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

interface FullPageLoadingProps {
  message?: string;
  className?: string;
}

export function FullPageLoading({ message = 'Loading...', className }: FullPageLoadingProps) {
  return (
    <div className={cn('min-h-screen bg-background flex items-center justify-center p-4', className)}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ message = 'Loading...', size = 'md', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 p-4', className)}>
      <LoadingSpinner size={size} className="text-primary" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({ isLoading, children, loadingText, className }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className={cn('flex items-center gap-2', className)}>
        <LoadingSpinner size="sm" />
        {loadingText || 'Loading...'}
      </span>
    );
  }
  return <>{children}</>;
}

// Quest Card Loading Skeleton
export function QuestCardSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Profile Loading Skeleton
export function ProfileSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <Skeleton className="w-20 h-20 rounded-full mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Form Loading Skeleton
export function FormSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Page Loading Skeleton
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Notification Loading Skeleton
export function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Upload Progress Component
interface UploadProgressProps {
  progress: number;
  fileName?: string;
  isUploading: boolean;
  error?: string;
}

export function UploadProgress({ progress, fileName, isUploading, error }: UploadProgressProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isUploading ? (
              <LoadingSpinner size="sm" className="text-primary" />
            ) : error ? (
              <div className="w-4 h-4 bg-destructive/20 rounded-full flex items-center justify-center">
                <span className="text-destructive text-xs">!</span>
              </div>
            ) : (
              <div className="w-4 h-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
            )}
            <span className="text-sm font-medium">
              {fileName || 'Upload'}
            </span>
          </div>

          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading states for different content types
export function LoadingWithIcon({
  icon: Icon = Target,
  message = 'Loading...',
  description,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>;
  message?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Different loading states for specific contexts
export const LoadingStates = {
  quests: () => <LoadingWithIcon icon={Target} message="Loading Quests" description="Finding the perfect adventures for you" />,
  profile: () => <LoadingWithIcon icon={User} message="Loading Profile" description="Getting your profile data" />,
  settings: () => <LoadingWithIcon icon={Settings} message="Loading Settings" description="Preparing your preferences" />,
  notifications: () => <LoadingWithIcon icon={Bell} message="Loading Notifications" description="Checking for updates" />,
  upload: () => <LoadingWithIcon icon={Camera} message="Processing Upload" description="Preparing your content" />,
  submission: () => <LoadingWithIcon icon={FileText} message="Submitting Quest" description="Recording your achievement" />,
  generation: () => <LoadingWithIcon icon={Sparkles} message="Generating Quest" description="Creating a personalized adventure" />
};