import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Zap, Flame, Crown } from "lucide-react";
import { mockLeaderboard, mockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [category, setCategory] = useState<'global' | 'friends' | 'local'>('global');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2: return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30";
      case 3: return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default: return "";
    }
  };

  const currentUserEntry = mockLeaderboard.find(entry => entry.userId === mockUser.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground">Compete with fellow questers</p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Filter Controls */}
        <div className="space-y-3">
          {/* Timeframe Filter */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            {[
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'all-time', label: 'All Time' }
            ].map(({ id, label }) => (
              <Button
                key={id}
                variant={timeframe === id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1",
                  timeframe === id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setTimeframe(id as any)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            {[
              { id: 'global', label: 'Global' },
              { id: 'friends', label: 'Friends' },
              { id: 'local', label: 'Local' }
            ].map(({ id, label }) => (
              <Button
                key={id}
                variant={category === id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1",
                  category === id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setCategory(id as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Current User Position */}
        {currentUserEntry && (
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    {getRankIcon(currentUserEntry.rank)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Your Position</p>
                    <p className="text-sm text-muted-foreground">#{currentUserEntry.rank} globally</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{currentUserEntry.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        <section>
          <h2 className="text-lg font-bold mb-4">Top Performers</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {/* 2nd Place */}
            <div className="text-center order-1">
              <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-gray-400/30">
                <span className="text-lg font-bold text-gray-300">2</span>
              </div>
              <h3 className="font-semibold text-sm truncate">{mockLeaderboard[1]?.username}</h3>
              <p className="text-xs text-muted-foreground">{mockLeaderboard[1]?.points.toLocaleString()}</p>
            </div>

            {/* 1st Place */}
            <div className="text-center order-2">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-yellow-500/30">
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-sm truncate">{mockLeaderboard[0]?.username}</h3>
              <p className="text-xs text-muted-foreground">{mockLeaderboard[0]?.points.toLocaleString()}</p>
              <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 text-xs">Champion</Badge>
            </div>

            {/* 3rd Place */}
            <div className="text-center order-3">
              <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-600/30">
                <span className="text-lg font-bold text-amber-600">3</span>
              </div>
              <h3 className="font-semibold text-sm truncate">{mockLeaderboard[2]?.username}</h3>
              <p className="text-xs text-muted-foreground">{mockLeaderboard[2]?.points.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Full Leaderboard */}
        <section>
          <h2 className="text-lg font-bold mb-4">Full Rankings</h2>
          <div className="space-y-2">
            {mockLeaderboard.map((entry, index) => (
              <Card 
                key={entry.userId} 
                className={cn(
                  "transition-all hover:shadow-lg",
                  getRankStyle(entry.rank),
                  entry.userId === mockUser.id && "ring-2 ring-primary"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="font-semibold text-sm">
                        {entry.username.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold truncate",
                        entry.userId === mockUser.id && "text-primary"
                      )}>
                        {entry.username}
                        {entry.userId === mockUser.id && " (You)"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{entry.completedQuests} quests</span>
                        {entry.streak > 0 && (
                          <span className="flex items-center gap-1 text-warning">
                            <Flame className="w-3 h-3" />
                            {entry.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Zap className="w-4 h-4 text-primary" />
                        {entry.points.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Competition Info */}
        <Card className="bg-muted/30">
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Weekly Competition
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ends in:</span>
                <span className="font-semibold">3 days, 14 hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prize Pool:</span>
                <span className="font-semibold text-primary">Premium Badges</span>
              </div>
              <Button variant="outline" className="w-full">
                View Rewards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}