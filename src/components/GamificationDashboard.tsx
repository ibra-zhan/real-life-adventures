import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles
} from 'lucide-react';
import { 
  useGamificationStats, 
  useUserLevel, 
  useUserBadges, 
  useAllLevelConfigs 
} from '@/hooks/useGamification';
import { cn } from '@/lib/utils';
import type { BadgeRarity } from '@/types';

export function GamificationDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const { data: stats, isLoading: statsLoading } = useGamificationStats();
  const { data: userLevel, isLoading: levelLoading } = useUserLevel();
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges();
  const { data: levelConfigs, isLoading: levelsLoading } = useAllLevelConfigs();

  const getRarityColor = (rarity: BadgeRarity) => {
    const colors = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500',
    };
    return colors[rarity] || colors.common;
  };

  const getRarityTextColor = (rarity: BadgeRarity) => {
    const colors = {
      common: 'text-gray-600',
      uncommon: 'text-green-600',
      rare: 'text-blue-600',
      epic: 'text-purple-600',
      legendary: 'text-yellow-600',
    };
    return colors[rarity] || colors.common;
  };

  if (statsLoading || levelLoading || badgesLoading || levelsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.currentLevel || 1}</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalXp || 0}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.badgesEarned || 0}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="level">Level Progress</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{userLevel?.name || 'Novice'}</div>
                  <div className="text-sm text-muted-foreground">Level {userLevel?.level || 1}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to next level</span>
                    <span>{userLevel?.progress || 0}%</span>
                  </div>
                  <Progress value={userLevel?.progress || 0} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{userLevel?.currentXp || 0} XP</span>
                    <span>{userLevel?.nextLevelXp || 100} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <Badge variant="outline">{stats?.currentStreak || 0} days</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Social Interactions</span>
                    </div>
                    <Badge variant="outline">{stats?.socialInteractions || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Quests Completed</span>
                    </div>
                    <Badge variant="outline">{stats?.questsCompleted || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Level Progress Tab */}
        <TabsContent value="level" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Level System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {levelConfigs?.map((level, index) => {
                  const isCurrentLevel = level.level === userLevel?.level;
                  const isUnlocked = level.level <= (userLevel?.level || 1);
                  
                  return (
                    <div
                      key={level.level}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        isCurrentLevel && "bg-primary/5 border-primary",
                        !isUnlocked && "opacity-50"
                      )}
                    >
                      <div className="text-2xl">{level.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Level {level.level}</h3>
                          <Badge 
                            variant={isCurrentLevel ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              isCurrentLevel && "bg-primary"
                            )}
                          >
                            {level.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {level.minXp} - {level.maxXp === Infinity ? '∞' : level.maxXp} XP
                        </div>
                      </div>
                      {isCurrentLevel && (
                        <div className="text-right">
                          <div className="text-sm font-medium">{userLevel?.progress || 0}%</div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userBadges?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Complete quests and activities to earn badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBadges?.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{badge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{badge.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getRarityTextColor(badge.rarity))}
                            >
                              {badge.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {badge.description}
                          </p>
                          {badge.earnedAt && (
                            <p className="text-xs text-muted-foreground">
                              Earned {new Date(badge.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Achievements coming soon!</p>
                <p className="text-sm">Track your progress and unlock special rewards</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
