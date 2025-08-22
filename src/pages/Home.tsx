import { useState } from "react";
import { QuestCard } from "@/components/ui/quest-card";
import { XPBar } from "@/components/ui/xp-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Zap, Flame, ChevronRight, Bell } from "lucide-react";
import { mockUser, mockQuests, mockNotifications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const dailyQuest = mockQuests[0];
  const otherQuests = mockQuests.slice(1);

  const filters = [
    { id: 'all', label: 'All Quests' },
    { id: 'kindness', label: 'Kindness' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'photography', label: 'Photography' }
  ];

  const filteredQuests = selectedFilter === 'all' 
    ? otherQuests 
    : otherQuests.filter(q => q.category.toLowerCase() === selectedFilter);

  const handleStartQuest = (questId: string) => {
    console.log('Starting quest:', questId);
    // In real app, navigate to quest detail
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gradient">SideQuest</h1>
            <p className="text-xs text-muted-foreground">Level up your life</p>
          </div>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications}
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
                  {mockUser.username.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{mockUser.username}</h2>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>{mockUser.totalPoints}</span>
                  </div>
                  <div className="flex items-center gap-1 streak-flame">
                    <Flame className="w-4 h-4" />
                    <span>{mockUser.currentStreak}</span>
                  </div>
                </div>
              </div>
            </div>
            <XPBar 
              current={mockUser.xp} 
              max={3000} 
              level={mockUser.level}
              showLabels={false}
            />
          </CardContent>
        </Card>

        {/* Daily Quest */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-gradient">Today's Featured Quest</span>
            <Badge className="bg-primary text-primary-foreground">+2x XP</Badge>
          </h2>
          <QuestCard 
            quest={dailyQuest} 
            variant="daily"
            onStart={handleStartQuest}
          />
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
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {filteredQuests.map((quest) => (
              <QuestCard 
                key={quest.id} 
                quest={quest}
                onStart={handleStartQuest}
                variant={quest.difficulty === 'epic' ? 'epic' : 'default'}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <Card className="bg-muted/30">
          <CardHeader>
            <h3 className="font-semibold">Quick Start</h3>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-sm">Random Quest</span>
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