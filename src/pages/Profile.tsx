import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XPBar } from "@/components/ui/xp-bar";
import { BadgeDisplay } from "@/components/ui/badge-display";
import { Settings, Share2, Calendar, Award, Zap, Flame, Crown } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { mockUser } from "@/lib/mock-data";

export default function Profile() {
  const { state } = useUser();
  const { user: authUser, isAuthenticated } = useAuthContext();
  
  // Use real user data if authenticated, otherwise fallback to mock
  const user = isAuthenticated && authUser ? state.user : mockUser;
  const completedBadges = user.badges.filter(b => b.unlockedAt);
  const inProgressBadges = user.badges.filter(b => !b.unlockedAt && b.progress);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gradient">Profile</h1>
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
              {mockUser.username.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{mockUser.username}</h2>
            <p className="text-muted-foreground mb-4">{mockUser.location}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mockUser.level}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{mockUser.totalPoints.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{mockUser.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>

            <XPBar 
              current={mockUser.xp} 
              max={3000} 
              level={mockUser.level}
            />

            <Button className="w-full mt-4 btn-quest">
              <Share2 className="w-4 h-4 mr-2" />
              Share Profile
            </Button>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">23</div>
              <div className="text-sm text-muted-foreground">Quests Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-6 h-6 text-warning streak-flame" />
              </div>
              <div className="text-2xl font-bold text-foreground">{mockUser.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Longest Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </h3>
            <Badge variant="secondary">{completedBadges.length}/{mockUser.badges.length}</Badge>
          </div>

          {/* Completed Badges */}
          <Card className="mb-4">
            <CardHeader>
              <h4 className="font-semibold text-success flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Unlocked Badges
              </h4>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {completedBadges.map((badge) => (
                  <BadgeDisplay 
                    key={badge.id} 
                    badge={badge} 
                    size="md"
                  />
                ))}
              </div>
              {completedBadges.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Complete your first quest to earn badges!
                </p>
              )}
            </CardContent>
          </Card>

          {/* In Progress Badges */}
          {inProgressBadges.length > 0 && (
            <Card>
              <CardHeader>
                <h4 className="font-semibold text-warning flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  In Progress
                </h4>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {inProgressBadges.map((badge) => (
                    <BadgeDisplay 
                      key={badge.id} 
                      badge={badge} 
                      size="sm"
                      showProgress
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Recent Activity</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Completed "Coffee Shop Compliment"</p>
                <p className="text-xs text-muted-foreground">2 hours ago • +100 XP</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">12-day streak milestone!</p>
                <p className="text-xs text-muted-foreground">Today • Streak bonus active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}