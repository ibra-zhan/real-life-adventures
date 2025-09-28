import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, Share2, LogOut, User, Shield, Bell, Trophy, Zap, Target, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useQuestProgress";
import { mockUser } from "@/lib/mock-data";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useUser();
  const { user: authUser, isAuthenticated, logout } = useAuthContext();
  const { data: userStats, isLoading: statsLoading } = useUserStats();

  // Use real user data if authenticated, otherwise fallback to mock
  const user = isAuthenticated && authUser ? state.user : mockUser;

  // Calculate level progress
  const calculateLevelProgress = (currentXP: number, currentLevel: number) => {
    const xpForCurrentLevel = (currentLevel - 1) * 200 + 100;
    const xpForNextLevel = currentLevel * 200 + 100;
    const progressXP = currentXP - xpForCurrentLevel;
    const totalXPNeeded = xpForNextLevel - xpForCurrentLevel;
    return Math.max(0, Math.min(100, (progressXP / totalXPNeeded) * 100));
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth context
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-3 py-2">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-bold text-gradient">Profile</h1>
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-3 py-4 w-full space-y-4">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Profile Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl font-bold text-primary mx-auto mb-3 relative">
                {user.username.charAt(0)}
                {userStats && (
                  <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5">
                    {userStats.currentLevel}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{user.username}</h2>
              <p className="text-sm text-muted-foreground mb-3">{user.location || 'Location not set'}</p>

              {/* XP and Level Progress */}
              {userStats && !statsLoading ? (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level {userStats.currentLevel}</span>
                    <span className="font-medium">{userStats.totalXP} XP</span>
                  </div>
                  <Progress
                    value={calculateLevelProgress(userStats.totalXP, userStats.currentLevel)}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {Math.ceil((userStats.currentLevel * 200 + 100) - userStats.totalXP)} XP to next level
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {statsLoading ? 'Loading progress...' : 'Start your adventure!'}
                  </div>
                </div>
              )}

              <Button className="w-full btn-quest">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quest Statistics */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <h3 className="text-lg font-semibold">Quest Statistics</h3>
          </CardHeader>
          <CardContent>
            {userStats && !statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-xl font-bold text-foreground">{userStats.questsCompleted}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-xl font-bold text-foreground">{userStats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-xl font-bold text-foreground">{userStats.totalXP}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="text-xl font-bold text-foreground">{userStats.longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Best Streak</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-4">🎯</div>
                <p>{statsLoading ? 'Loading statistics...' : 'Complete quests to see your progress here!'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <h3 className="text-lg font-semibold">Settings</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-sm py-2"
              onClick={() => navigate('/account-settings')}
            >
              <User className="w-4 h-4 mr-2 shrink-0" />
              Account Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm py-2"
              onClick={() => navigate('/privacy-settings')}
            >
              <Shield className="w-4 h-4 mr-2 shrink-0" />
              Privacy Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm py-2"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-4 h-4 mr-2 shrink-0" />
              Notifications
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start text-sm py-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2 shrink-0" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}