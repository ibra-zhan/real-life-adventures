import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Flame, 
  Users, 
  Award,
  TrendingUp,
  Crown,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { GamificationDashboard } from '@/components/GamificationDashboard';
import { useGamificationStats, useGamificationHealth } from '@/hooks/useGamification';

export default function Gamification() {
  const { data: stats, isLoading: statsLoading } = useGamificationStats();
  const { data: health, isLoading: healthLoading } = useGamificationHealth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Gamification</h1>
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
                <Trophy className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.currentLevel || 1}
                  </div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.totalXp || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.badgesEarned || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.currentStreak || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <GamificationDashboard />

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                How to Earn XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Complete Quests</span>
                </div>
                <Badge variant="outline">+50-500 XP</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Social Interactions</span>
                </div>
                <Badge variant="outline">+10-50 XP</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Daily Streaks</span>
                </div>
                <Badge variant="outline">+25 XP/day</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Earn Badges</span>
                </div>
                <Badge variant="outline">+100-1000 XP</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Level Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">Higher levels unlock:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Exclusive quest categories</li>
                  <li>• Special badges and titles</li>
                  <li>• Priority support access</li>
                  <li>• Advanced features</li>
                  <li>• Community recognition</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
