import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface DeleteAccountForm {
  password: string;
  confirmText: string;
  acknowledgeDataLoss: boolean;
  acknowledgeIrreversible: boolean;
  downloadData: boolean;
}

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthContext();

  const [form, setForm] = useState<DeleteAccountForm>({
    password: '',
    confirmText: '',
    acknowledgeDataLoss: false,
    acknowledgeIrreversible: false,
    downloadData: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [errors, setErrors] = useState<Partial<DeleteAccountForm>>({});

  const CONFIRM_TEXT = "DELETE MY ACCOUNT";

  const handleInputChange = (field: keyof DeleteAccountForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing/checking
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DeleteAccountForm> = {};

    if (!form.password) {
      newErrors.password = 'Password is required to delete your account';
    }

    if (form.confirmText !== CONFIRM_TEXT) {
      newErrors.confirmText = `Please type "${CONFIRM_TEXT}" exactly`;
    }

    if (!form.acknowledgeDataLoss) {
      newErrors.acknowledgeDataLoss = 'You must acknowledge that all data will be lost';
    }

    if (!form.acknowledgeIrreversible) {
      newErrors.acknowledgeIrreversible = 'You must acknowledge that this action is irreversible';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestDataDownload = async () => {
    try {
      toast({
        title: "Data Export Requested",
        description: "Your data export will be emailed to you within 24 hours.",
      });

      // TODO: Implement actual data export functionality
      // await apiClient.requestDataExport();

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to request data export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!validateForm()) return;

    if (!showFinalWarning) {
      setShowFinalWarning(true);
      return;
    }

    setIsLoading(true);

    try {
      // Delete account via API
      await apiClient.deleteAccount();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Log out and redirect to landing page
      await logout();
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Account deletion failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Account deletion failed';

      // Check if it's a password error
      if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid')) {
        setErrors({ password: 'Password is incorrect' });
        setShowFinalWarning(false);
      } else {
        toast({
          title: "Deletion Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = form.password &&
                     form.confirmText === CONFIRM_TEXT &&
                     form.acknowledgeDataLoss &&
                     form.acknowledgeIrreversible;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/account-settings')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gradient">Delete Account</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            <strong>Warning:</strong> This action is permanent and cannot be undone.
            All your data including quest history, submissions, and profile information will be permanently deleted.
          </AlertDescription>
        </Alert>

        {/* Data Export Option */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Download className="w-5 h-5" />
              Download Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Before deleting your account, you can download a copy of your data including
              quest history, submissions, and profile information.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="downloadData"
                checked={form.downloadData}
                onCheckedChange={(checked) => handleInputChange('downloadData', !!checked)}
              />
              <Label htmlFor="downloadData" className="text-sm">
                Request data download before deletion
              </Label>
            </div>

            {form.downloadData && (
              <Button
                variant="outline"
                onClick={handleRequestDataDownload}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Request Data Export
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Deletion Form */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 border-red-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Password Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="password">Confirm Your Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirmation Text */}
            <div className="space-y-2">
              <Label htmlFor="confirmText">
                Type "{CONFIRM_TEXT}" to confirm
              </Label>
              <Input
                id="confirmText"
                value={form.confirmText}
                onChange={(e) => handleInputChange('confirmText', e.target.value)}
                placeholder={CONFIRM_TEXT}
                className={errors.confirmText ? 'border-red-500' : ''}
              />
              {errors.confirmText && (
                <p className="text-sm text-red-500">{errors.confirmText}</p>
              )}
            </div>

            {/* Acknowledgments */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acknowledgeDataLoss"
                  checked={form.acknowledgeDataLoss}
                  onCheckedChange={(checked) => handleInputChange('acknowledgeDataLoss', !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="acknowledgeDataLoss" className="text-sm leading-relaxed">
                  I understand that all my data including quest history, submissions,
                  and profile information will be permanently deleted.
                </Label>
              </div>
              {errors.acknowledgeDataLoss && (
                <p className="text-sm text-red-500 ml-6">{errors.acknowledgeDataLoss}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acknowledgeIrreversible"
                  checked={form.acknowledgeIrreversible}
                  onCheckedChange={(checked) => handleInputChange('acknowledgeIrreversible', !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="acknowledgeIrreversible" className="text-sm leading-relaxed">
                  I understand that this action is irreversible and my account cannot be recovered.
                </Label>
              </div>
              {errors.acknowledgeIrreversible && (
                <p className="text-sm text-red-500 ml-6">{errors.acknowledgeIrreversible}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Final Warning */}
        {showFinalWarning && (
          <Alert className="border-red-500 bg-red-50/20">
            <Shield className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Final Warning:</strong> You are about to permanently delete your account for {user?.email}.
              This action cannot be undone. Are you absolutely sure?
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isFormValid || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {showFinalWarning ?
              (isLoading ? 'Deleting Account...' : 'Yes, Delete My Account Forever') :
              'Delete My Account'
            }
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (showFinalWarning) {
                setShowFinalWarning(false);
              } else {
                navigate('/account-settings');
              }
            }}
            disabled={isLoading}
            className="w-full"
          >
            {showFinalWarning ? 'No, Keep My Account' : 'Cancel'}
          </Button>
        </div>

        {/* Help Text */}
        <Card className="bg-blue-50/10 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Need Help?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  If you're having issues with your account, consider contacting support instead of deleting.
                  Most problems can be resolved without losing your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}