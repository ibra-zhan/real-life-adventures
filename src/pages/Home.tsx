import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuestCard } from "@/components/ui/quest-card";
import { XPBar } from "@/components/ui/xp-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Flame, ChevronRight, Bell, AlertCircle, RefreshCw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuests, useFeaturedQuest, useRandomQuest } from "@/hooks/useQuests";
import { useUnreadNotificationsCount } from "@/hooks/useLeaderboard";
import { calculateXPToNextLevel } from "@/lib/progression";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AuthTest } from "@/components/AuthTest";

export default function Home() {
  const navigate = useNavigate();
  const { state } = useUser();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  const user = state.user;
  const xpProgress = calculateXPToNextLevel(user.xp);
  
  // Data fetching hooks
  const { data: featuredQuest, isLoading: featuredLoading, error: featuredError } = useFeaturedQuest();
  const { data: quests = [], isLoading: questsLoading, error: questsError, refetch: refetchQuests } = useQuests(selectedFilter === 'all' ? undefined : selectedFilter);
  const unreadCount = useUnreadNotificationsCount();
  const randomQuestMutation = useRandomQuest();
  
  // Filter out featured quest from the regular list
  const otherQuests = quests.filter(q => q.id !== featuredQuest?.id);

  const filters = [
    { id: 'all', label: 'All Quests' },
    { id: 'kindness', label: 'Kindness' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'photography', label: 'Photography' }
  ];

  const handleStartQuest = (questId: string) => {
    navigate(`/quest/${questId}`);
  };

  const handleRandomQuest = () => {
    randomQuestMutation.mutate(undefined, {
      onSuccess: (quest) => {
        toast.success(`Random quest: ${quest.title}`);
        navigate(`/quest/${quest.id}`);
      },
      onError: (error) => {
        toast.error("Failed to get random quest. Please try again.");
      }
    });
  };

  const handleRefresh = () => {
    refetchQuests();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Auth Test - Remove this in production */}
      <div className="p-4">
        <AuthTest />
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gradient">SideQuest</h1>
            <p className="text-xs text-muted-foreground">Level up your life</p>
          </div>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* User Stats */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {user.username.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{user.username}</h2>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>{user.totalPoints}</span>
                  </div>
                  <div className="flex items-center gap-1 streak-flame">
                    <Flame className="w-4 h-4" />
                    <span>{user.currentStreak}</span>
                  </div>
                </div>
              </div>
            </div>
            <XPBar 
              current={xpProgress.current} 
              max={xpProgress.max} 
              level={user.level}
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Featured Quest */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-gradient">Today's Featured Quest</span>
            <Badge className="bg-primary text-primary-foreground">+2x XP</Badge>
          </h2>
          
          {featuredLoading ? (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : featuredError ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                  <div>
                    <p className="text-destructive font-medium">Failed to load featured quest</p>
                    <p className="text-sm text-muted-foreground">Please try again later</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : featuredQuest ? (
            <QuestCard 
              quest={featuredQuest} 
              variant="daily"
              onStart={handleStartQuest}
            />
          ) : null}
        </section>

        {/* Quest Filters */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "shrink-0 transition-all",
                  selectedFilter === filter.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Quest Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Discover Quests</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={handleRefresh}>
              <RefreshCw className={cn("w-4 h-4 mr-1", questsLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
          
          {questsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : questsError ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                  <div>
                    <p className="text-destructive font-medium">Failed to load quests</p>
                    <p className="text-sm text-muted-foreground">Check your connection and try again</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : otherQuests.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-2xl">🔍</div>
                  <div>
                    <p className="font-medium">No quests found</p>
                    <p className="text-sm text-muted-foreground">Try a different filter or check back later</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedFilter('all')}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {otherQuests.map((quest) => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest}
                  onStart={handleStartQuest}
                  variant={quest.difficulty === 'epic' ? 'epic' : 'default'}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <Card className="bg-muted/30">
          <CardHeader>
            <h3 className="font-semibold">Quick Start</h3>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col gap-2 h-auto py-4"
              onClick={handleRandomQuest}
              disabled={randomQuestMutation.isPending}
            >
              <Zap className={cn("w-6 h-6 text-primary", randomQuestMutation.isPending && "animate-pulse")} />
              <span className="text-sm">
                {randomQuestMutation.isPending ? "Finding..." : "Random Quest"}
              </span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
              <Flame className="w-6 h-6 text-warning" />
              <span className="text-sm">Streak Saver</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}