import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function EmailVerificationBanner({ onDismiss, className }: EmailVerificationBannerProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if email is already verified or user is not available
  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);

    try {
      await apiClient.resendVerificationEmail();

      toast({
        title: "Verification Email Sent",
        description: "Check your email for a verification link.",
      });

    } catch (error: any) {
      console.error('Resend verification failed:', error);
      toast({
        title: "Failed to Send",
        description: error?.response?.data?.message || "Failed to send verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className={`border-amber-200 bg-amber-50/10 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-900 dark:text-amber-100">
                Email Not Verified
              </span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Please verify your email address to secure your account and receive important notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isResending ? (
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              {isResending ? 'Sending...' : 'Verify'}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}