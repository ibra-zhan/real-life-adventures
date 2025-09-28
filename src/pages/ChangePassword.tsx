import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Key,
  Save,
  Eye,
  EyeOff,
  Shield,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});

  // Calculate password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    let feedback: string[] = [];
    if (!checks.length) feedback.push('At least 8 characters');
    if (!checks.uppercase) feedback.push('One uppercase letter');
    if (!checks.lowercase) feedback.push('One lowercase letter');
    if (!checks.number) feedback.push('One number');
    if (!checks.special) feedback.push('One special character');

    return { score, feedback, checks };
  };

  const passwordStrength = getPasswordStrength(form.newPassword);
  const strengthColor = passwordStrength.score < 2 ? 'bg-red-500' :
                       passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthText = passwordStrength.score < 2 ? 'Weak' :
                      passwordStrength.score < 4 ? 'Medium' : 'Strong';

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = 'Password is too weak. Please follow the requirements below.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await apiClient.changePassword(form.currentPassword, form.newPassword);

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });

      // Clear form
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Navigate back to account settings
      navigate('/account-settings');
    } catch (error) {
      console.error('Password change failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Password change failed';

      // Check if it's a current password error
      if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('invalid')) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        toast({
          title: "Password Change Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
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
            onClick={() => navigate('/account-settings')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gradient">Change Password</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Security Notice */}
        <Card className="bg-blue-50/10 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Security Notice</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Changing your password will sign you out of all devices. You'll need to sign in again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Form */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Update Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className={errors.currentPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-500">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className={errors.newPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}

              {/* Password Strength Indicator */}
              {form.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Password Strength</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.score < 2 ? 'text-red-500' :
                      passwordStrength.score < 4 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {strengthText}
                    </span>
                  </div>
                  <Progress
                    value={(passwordStrength.score / 5) * 100}
                    className="h-2"
                  />

                  {/* Password Requirements */}
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries(passwordStrength.checks).map(([requirement, met]) => (
                      <div key={requirement} className="flex items-center gap-2">
                        {met ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-red-500" />
                        )}
                        <span className={met ? 'text-green-600' : 'text-muted-foreground'}>
                          {requirement === 'length' && 'At least 8 characters'}
                          {requirement === 'uppercase' && 'One uppercase letter'}
                          {requirement === 'lowercase' && 'One lowercase letter'}
                          {requirement === 'number' && 'One number'}
                          {requirement === 'special' && 'One special character'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/account-settings')}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </main>
    </div>
  );
}