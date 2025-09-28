import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface VerificationState {
  status: 'pending' | 'verifying' | 'success' | 'error' | 'expired';
  message: string;
}

export default function EmailVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuthContext();
  const [searchParams] = useSearchParams();

  const [verification, setVerification] = useState<VerificationState>({
    status: 'pending',
    message: ''
  });
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const [isManualVerifying, setIsManualVerifying] = useState(false);

  // Check for token in URL params
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      verifyEmailWithToken(token);
    }
  }, [token]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const verifyEmailWithToken = async (verificationToken: string) => {
    setVerification({ status: 'verifying', message: 'Verifying your email...' });

    try {
      await apiClient.verifyEmail(verificationToken);

      setVerification({
        status: 'success',
        message: 'Your email has been successfully verified!'
      });

      // Refresh user data to reflect verification status
      await refreshUser();

      toast({
        title: "Email Verified",
        description: "Your email address has been successfully verified.",
      });

      // Redirect to profile after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error: any) {
      console.error('Email verification failed:', error);

      const errorMessage = error?.response?.data?.message || error.message || 'Verification failed';
      const status = errorMessage.includes('expired') ? 'expired' : 'error';

      setVerification({
        status,
        message: errorMessage
      });

      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);

    try {
      await apiClient.resendVerificationEmail();

      setResendCooldown(60); // 60 second cooldown

      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
      });

    } catch (error: any) {
      console.error('Resend verification failed:', error);
      toast({
        title: "Resend Failed",
        description: error?.response?.data?.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsManualVerifying(true);

    try {
      await apiClient.verifyEmailWithCode(manualCode.trim());

      setVerification({
        status: 'success',
        message: 'Your email has been successfully verified!'
      });

      await refreshUser();

      toast({
        title: "Email Verified",
        description: "Your email address has been successfully verified.",
      });

      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error: any) {
      console.error('Manual verification failed:', error);
      toast({
        title: "Verification Failed",
        description: error?.response?.data?.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsManualVerifying(false);
    }
  };

  const getStatusIcon = () => {
    switch (verification.status) {
      case 'verifying':
        return <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Mail className="w-8 h-8 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (verification.status) {
      case 'success':
        return 'border-green-200 bg-green-50/10';
      case 'error':
      case 'expired':
        return 'border-red-200 bg-red-50/10';
      case 'verifying':
        return 'border-blue-200 bg-blue-50/10';
      default:
        return 'border-border bg-card/50';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gradient">Email Verification</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Verification Status */}
        <Card className={`backdrop-blur-sm border-border/50 ${getStatusColor()}`}>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              {getStatusIcon()}
            </div>

            <h2 className="text-xl font-semibold mb-2">
              {verification.status === 'success' ? 'Email Verified!' :
               verification.status === 'verifying' ? 'Verifying...' :
               verification.status === 'expired' ? 'Link Expired' :
               verification.status === 'error' ? 'Verification Failed' :
               'Verify Your Email'}
            </h2>

            <p className="text-muted-foreground mb-4">
              {verification.message ||
               `We've sent a verification link to ${email || user?.email || 'your email address'}.`}
            </p>

            {verification.status === 'success' && (
              <div className="text-sm text-green-600 dark:text-green-400">
                Redirecting to your profile...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resend Verification */}
        {(verification.status === 'pending' || verification.status === 'expired' || verification.status === 'error') && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Didn't receive the email?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Check your spam folder or request a new verification email.
              </p>

              <Button
                onClick={handleResendVerification}
                disabled={isResending || resendCooldown > 0}
                className="w-full"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : resendCooldown > 0 ? (
                  <Clock className="w-4 h-4 mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                  ? 'Sending...'
                  : 'Resend Verification Email'
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Code Entry */}
        {(verification.status === 'pending' || verification.status === 'expired' || verification.status === 'error') && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you received a verification code, enter it below.
              </p>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center tracking-widest"
                />
              </div>

              <Button
                onClick={handleManualVerification}
                disabled={isManualVerifying || !manualCode.trim()}
                className="w-full"
              >
                {isManualVerifying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isManualVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Need help with verification?</p>
              <ul className="text-sm space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure your email address is correct</li>
                <li>• Verification links expire after 24 hours</li>
                <li>• Contact support if you continue having issues</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Back to Profile */}
        {verification.status !== 'success' && (
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="w-full"
          >
            Back to Profile
          </Button>
        )}
      </main>
    </div>
  );
}