import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react';
import { 
  useNotificationSettings, 
  useUpdateNotificationSettings 
} from '@/hooks/useNotifications';
// Removed notification constants for MVP
import type { NotificationSettings, NotificationType } from '@/types';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: currentSettings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const handleSettingChange = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newSettings;
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleReset = () => {
    setSettings({});
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const current = { ...currentSettings, ...settings };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Global Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Preferences */}
          <div className="space-y-4">
            <h3 className="font-medium">Notification Channels</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <Label htmlFor="inApp">In-App</Label>
                </div>
                <Switch
                  id="inApp"
                  checked={current.inApp || false}
                  onCheckedChange={(checked) => handleSettingChange('inApp', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <Switch
                  id="email"
                  checked={current.email || false}
                  onCheckedChange={(checked) => handleSettingChange('email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <Label htmlFor="push">Push</Label>
                </div>
                <Switch
                  id="push"
                  checked={current.push || false}
                  onCheckedChange={(checked) => handleSettingChange('push', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <Switch
                  id="sms"
                  checked={current.sms || false}
                  onCheckedChange={(checked) => handleSettingChange('sms', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Frequency Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Frequency</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={current.frequency || 'instant'}
                  onValueChange={(value) => handleSettingChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="digest">Digest Mode</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {current.digest ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={current.digest || false}
                    onCheckedChange={(checked) => handleSettingChange('digest', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="font-medium">Quiet Hours</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quietHours">Enable Quiet Hours</Label>
                <Switch
                  id="quietHours"
                  checked={current.quietHours?.enabled || false}
                  onCheckedChange={(checked) => handleSettingChange('quietHours.enabled', checked)}
                />
              </div>
              
              {current.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={current.quietHours?.start || '22:00'}
                      onChange={(e) => handleSettingChange('quietHours.start', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={current.quietHours?.end || '08:00'}
                      onChange={(e) => handleSettingChange('quietHours.end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(current.types || {}).map(([type, typeSettings]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-blue-500">
                    🔔
                  </span>
                  <span className="font-medium capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-4 ml-6">
                  {Object.entries(typeSettings).map(([channel, enabled]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <Label htmlFor={`${type}-${channel}`} className="text-sm">
                        {channel}
                      </Label>
                      <Switch
                        id={`${type}-${channel}`}
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          handleSettingChange(`types.${type}.${channel}`, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
        >
          {updateSettings.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
