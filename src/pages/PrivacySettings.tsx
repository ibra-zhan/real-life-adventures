import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Shield,
  Eye,
  MapPin,
  Share2,
  Download,
  Trash2,
  Users,
  Globe,
  Lock,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showLocation: boolean;
  showJoinDate: boolean;
  showQuestHistory: boolean;
  allowQuestSharing: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  dataCollection: {
    analytics: boolean;
    performance: boolean;
    personalization: boolean;
  };
  notifications: {
    questReminders: boolean;
    friendActivity: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
  };
}

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showLocation: true,
    showJoinDate: true,
    showQuestHistory: true,
    allowQuestSharing: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    dataCollection: {
      analytics: true,
      performance: true,
      personalization: true,
    },
    notifications: {
      questReminders: true,
      friendActivity: true,
      systemUpdates: true,
      marketingEmails: false,
    }
  });

  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const loadUserPreferences = async () => {
    try {
      // TODO: Load actual user preferences from API
      // const preferences = await apiClient.getUserPreferences();
      // setSettings(preferences);
      // setOriginalSettings(preferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleSettingChange = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof PrivacySettings] as any,
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update preferences via API
      await apiClient.updatePreferences(settings);

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    try {
      toast({
        title: "Data Export Requested",
        description: "Your data export will be emailed to you within 24 hours.",
      });

      // TODO: Implement actual data export
      // await apiClient.requestDataExport();
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to request data export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDataDeletion = () => {
    navigate('/delete-account');
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
          <h1 className="text-xl font-bold text-gradient">Privacy Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Profile Visibility */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Profile Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Who can see your profile?</Label>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value: 'public' | 'friends' | 'private') =>
                  handleSettingChange('profileVisibility', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public - Anyone can view
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Friends Only
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Private - Only you
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your location on your profile
                  </p>
                </div>
                <Switch
                  checked={settings.showLocation}
                  onCheckedChange={(checked) => handleSettingChange('showLocation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Join Date</Label>
                  <p className="text-sm text-muted-foreground">
                    Display when you joined the platform
                  </p>
                </div>
                <Switch
                  checked={settings.showJoinDate}
                  onCheckedChange={(checked) => handleSettingChange('showJoinDate', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Quest History</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see your completed quests
                  </p>
                </div>
                <Switch
                  checked={settings.showQuestHistory}
                  onCheckedChange={(checked) => handleSettingChange('showQuestHistory', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Settings */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Social & Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Quest Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Others can share your quest completions
                </p>
              </div>
              <Switch
                checked={settings.allowQuestSharing}
                onCheckedChange={(checked) => handleSettingChange('allowQuestSharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Friend Requests</Label>
                <p className="text-sm text-muted-foreground">
                  Other users can send you friend requests
                </p>
              </div>
              <Switch
                checked={settings.allowFriendRequests}
                onCheckedChange={(checked) => handleSettingChange('allowFriendRequests', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Online Status</Label>
                <p className="text-sm text-muted-foreground">
                  Let friends see when you're active
                </p>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics Data</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the app with usage analytics
                </p>
              </div>
              <Switch
                checked={settings.dataCollection.analytics}
                onCheckedChange={(checked) => handleSettingChange('dataCollection.analytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Performance Data</Label>
                <p className="text-sm text-muted-foreground">
                  Share performance metrics to help optimize the app
                </p>
              </div>
              <Switch
                checked={settings.dataCollection.performance}
                onCheckedChange={(checked) => handleSettingChange('dataCollection.performance', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Personalization</Label>
                <p className="text-sm text-muted-foreground">
                  Use your data to personalize quest recommendations
                </p>
              </div>
              <Switch
                checked={settings.dataCollection.personalization}
                onCheckedChange={(checked) => handleSettingChange('dataCollection.personalization', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Notification Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Quest Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders about incomplete quests
                </p>
              </div>
              <Switch
                checked={settings.notifications.questReminders}
                onCheckedChange={(checked) => handleSettingChange('notifications.questReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Friend Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when friends complete quests
                </p>
              </div>
              <Switch
                checked={settings.notifications.friendActivity}
                onCheckedChange={(checked) => handleSettingChange('notifications.friendActivity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Important app updates and security notices
                </p>
              </div>
              <Switch
                checked={settings.notifications.systemUpdates}
                onCheckedChange={(checked) => handleSettingChange('notifications.systemUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Promotional content and feature announcements
                </p>
              </div>
              <Switch
                checked={settings.notifications.marketingEmails}
                onCheckedChange={(checked) => handleSettingChange('notifications.marketingEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Rights */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Your Data Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You have the right to access, export, or delete your personal data in accordance with privacy laws.
            </p>

            <Button
              variant="outline"
              onClick={handleDataExport}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>

            <Button
              variant="destructive"
              onClick={handleDataDeletion}
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account & Data
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
              {isSaving ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}