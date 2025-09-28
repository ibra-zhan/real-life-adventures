import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wand2, 
  Sparkles, 
  Target, 
  BarChart3, 
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';
import { QuestGenerator } from '@/components/QuestGenerator';
import { useGenerationStats } from '@/hooks/useAIQuests';
import { useQuests } from '@/hooks/useQuests';
import type { Quest } from '@/types';

export default function AIQuests() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  
  const { data: stats, isLoading: statsLoading } = useGenerationStats();
  const { data: recentQuests, isLoading: questsLoading } = useQuests({ limit: 5, sortBy: 'createdAt' });

  const handleQuestGenerated = (_quest: Quest) => {
    setSelectedQuest(_quest);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Wand2 className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg font-bold truncate">AI Quests</h1>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI
          </Badge>
        </div>
      </header>

      <div className="w-full px-3 py-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-bold">
                    {statsLoading ? <Skeleton className="h-5 w-6" /> : stats?.totalGenerated || 0}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-bold">
                    {statsLoading ? <Skeleton className="h-5 w-6" /> : stats?.successRate || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Success</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-bold">
                    {statsLoading ? <Skeleton className="h-5 w-6" /> : stats?.avgGenerationTime || 0}s
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Avg Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-bold truncate">
                    {statsLoading ? <Skeleton className="h-5 w-8" /> : stats?.popularCategory || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Top</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2 text-sm">
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <QuestGenerator onQuestGenerated={handleQuestGenerated} />
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recently Generated Quests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your latest AI-generated quests
                </p>
              </CardHeader>
              <CardContent>
                {questsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentQuests?.length > 0 ? (
                  <div className="space-y-4">
                    {recentQuests.map((quest) => (
                      <Card key={quest.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">{quest.title}</h4>
                            <p className="text-sm text-muted-foreground">{quest.shortDescription}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline">{quest.difficulty}</Badge>
                              <Badge variant="secondary">{quest.category?.name}</Badge>
                              <Badge variant="outline">{quest.points} pts</Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuest(quest)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No quests generated yet.</p>
                    <p className="text-sm">Start generating quests to see them here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Quest Details */}
        {selectedQuest && (
          <Card>
            <CardHeader>
              <CardTitle>Quest Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedQuest.title}</h3>
                  <p className="text-muted-foreground">{selectedQuest.shortDescription}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedQuest.difficulty}</Badge>
                  <Badge variant="secondary">
                    {selectedQuest.category?.name || 'Unknown Category'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedQuest.estimatedTime}m
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {selectedQuest.points} pts
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedQuest.description}</p>
                </div>

                {selectedQuest.requirements && selectedQuest.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {selectedQuest.requirements.map((req, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
