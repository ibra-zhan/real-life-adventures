import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  Settings, 
  BarChart3, 
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { NotificationList } from '@/components/NotificationList';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useNotificationStats, useNotificationHealth } from '@/hooks/useNotifications';
import type { Notification } from '@/types';

export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState('list');
  
  const { data: stats, isLoading: statsLoading } = useNotificationStats();
  const { data: health, isLoading: healthLoading } = useNotificationHealth();

  const handleNotificationAction = (action: string, notification: Notification) => {
    console.log('Notification action:', action, notification);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {healthLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge 
                variant={health?.status === 'healthy' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {health?.status === 'healthy' ? 'System Online' : 'System Offline'}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.total || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.unread || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : `${Math.round(stats?.readRate || 0)}%`}
                  </div>
                  <div className="text-xs text-muted-foreground">Read Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.lastWeek || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="list" className="space-y-4">
            <NotificationList onNotificationAction={handleNotificationAction} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <NotificationSettings />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Channel Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats?.byChannel || {}).map(([channel, count]) => (
                        <div key={channel} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {channel === 'in_app' && <Smartphone className="w-4 h-4" />}
                            {channel === 'email' && <Mail className="w-4 h-4" />}
                            {channel === 'push' && <Bell className="w-4 h-4" />}
                            {channel === 'sms' && <MessageSquare className="w-4 h-4" />}
                            <span className="capitalize">{channel.replace('_', ' ')}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats?.byType || {})
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize text-sm">
                            {type.replace('_', ' ')}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {statsLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${Math.round(stats?.readRate || 0)}%`}
                    </div>
                    <div className="text-sm text-muted-foreground">Read Rate</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {statsLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${Math.round(stats?.clickRate || 0)}%`}
                    </div>
                    <div className="text-sm text-muted-foreground">Click Rate</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {statsLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : stats?.lastMonth || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Month</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
