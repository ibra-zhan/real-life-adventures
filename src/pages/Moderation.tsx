import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag, 
  BarChart3,
  Settings,
  Clock,
  Users,
  Eye
} from 'lucide-react';
import { ModerationDashboard } from '@/components/ModerationDashboard';
import { useModerationStats, useModerationHealth } from '@/hooks/useModeration';

export default function Moderation() {
  const { data: stats, isLoading: statsLoading } = useModerationStats();
  const { data: health, isLoading: healthLoading } = useModerationHealth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Content Moderation</h1>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.total || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.pending || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.approved || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.rejected || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <ModerationDashboard />

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Moderation Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">AI-Powered Moderation:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Text analysis for profanity and hate speech</li>
                  <li>• Image recognition for inappropriate content</li>
                  <li>• Video content analysis and filtering</li>
                  <li>• Spam and phishing detection</li>
                  <li>• Automated flagging and escalation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Moderation Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">Available Actions:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Approve content for publication</li>
                  <li>• Reject content with reasons</li>
                  <li>• Flag content for human review</li>
                  <li>• Escalate complex cases</li>
                  <li>• Track moderation history</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
