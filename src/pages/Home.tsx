import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuestCard } from "@/components/ui/quest-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Zap, Flame, ChevronRight, Bell, AlertCircle, RefreshCw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuests, useFeaturedQuest, useRandomQuest } from "@/hooks/useQuests";
// Removed useUnreadNotificationsCount import for MVP
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function Home() {
  const navigate = useNavigate();
  const { state } = useUser();
  
  const user = state.user;
  
  // Data fetching hooks
  const { data: featuredQuest, isLoading: featuredLoading, error: featuredError } = useFeaturedQuest();
  const { data: quests = [], isLoading: questsLoading, error: questsError, refetch: refetchQuests } = useQuests();
  // Removed unreadCount for MVP
  const randomQuestMutation = useRandomQuest();
  
  // Filter out featured quest from the regular list
  const otherQuests = quests.filter(q => q.id !== featuredQuest?.id);


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
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-3 py-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-lg font-bold text-gradient">SideQuest</h1>
            <p className="text-xs text-muted-foreground">Level up your life</p>
          </div>
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="w-full px-3 py-4 space-y-4">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

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
                <div className="text-sm text-muted-foreground">
                  Welcome back!
                </div>
              </div>
            </div>
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
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Refresh
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
          <CardContent className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
              onClick={handleRandomQuest}
              disabled={randomQuestMutation.isPending}
            >
              <Zap className={cn("w-5 h-5 text-primary", randomQuestMutation.isPending && "animate-pulse")} />
              <span className="text-xs">
                {randomQuestMutation.isPending ? "Finding..." : "Random Quest"}
              </span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-1 h-auto py-3">
              <Flame className="w-5 h-5 text-warning" />
              <span className="text-xs">Streak Saver</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}