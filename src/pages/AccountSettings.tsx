import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AvatarUpload } from '@/components/AvatarUpload';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Trash2,
  Key,
  RefreshCw
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api-client';

interface ProfileForm {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  location: string;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, refreshUser } = useAuthContext();
  const { state: userState, updateUser } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: ''
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Initialize form with user data
  useEffect(() => {
    if (authUser) {
      setForm({
        username: authUser.username || '',
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        location: authUser.location || ''
      });
      setAvatarUrl(authUser.avatar || null);
    }
  }, [authUser]);

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      // Check if form has changes compared to original user data
      const hasChanges = authUser && (
        updated.username !== (authUser.username || '') ||
        updated.firstName !== (authUser.firstName || '') ||
        updated.lastName !== (authUser.lastName || '') ||
        updated.email !== (authUser.email || '') ||
        updated.bio !== (authUser.bio || '') ||
        updated.location !== (authUser.location || '')
      );

      setHasChanges(!!hasChanges);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Update profile via API
      const updatedUser = await apiClient.updateProfile({
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        location: form.location
      });

      // Update local user context
      updateUser({
        username: form.username,
        location: form.location
      });

      // Refresh auth user data
      await refreshUser();

      setHasChanges(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    setHasChanges(true);
  };

  const handleAvatarUploadStart = () => {
    setSaving(true);
  };

  const handleAvatarUploadComplete = (success: boolean) => {
    setSaving(false);
    if (success) {
      setHasChanges(false);
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
          <h1 className="text-xl font-bold text-gradient">Account Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Profile Picture */}
        <AvatarUpload
          currentAvatar={avatarUrl}
          onAvatarChange={handleAvatarChange}
          onUploadStart={handleAvatarUploadStart}
          onUploadComplete={handleAvatarUploadComplete}
          maxSizeInMB={5}
          allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
        />

        {/* Basic Information */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">
                {form.bio.length}/200 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter your location"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={form.email}
                  disabled
                  className="bg-muted"
                />
                <Badge variant={authUser?.emailVerified ? "default" : "destructive"}>
                  {authUser?.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Email changes require verification and will be available soon.
                </span>
                {!authUser?.emailVerified && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/verify-email')}
                    className="h-auto p-0 text-xs text-primary"
                  >
                    Verify Email
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                <Calendar className="w-4 h-4 inline mr-1" />
                Member Since
              </Label>
              <Input
                value={authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Unknown'}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Actions */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/change-password')}
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/privacy-settings')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy Settings
            </Button>

            <Separator />

            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => navigate('/delete-account')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-20 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}