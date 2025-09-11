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
  Lightbulb,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';
import { QuestGenerator } from '@/components/QuestGenerator';
import { useGenerationStats, usePersonalizedSuggestions } from '@/hooks/useAIQuests';
import { useQuests } from '@/hooks/useQuests';
import type { Quest } from '@/types';

export default function AIQuests() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  
  const { data: stats, isLoading: statsLoading } = useGenerationStats();
  const { data: suggestions, isLoading: suggestionsLoading } = usePersonalizedSuggestions();
  const { data: recentQuests, isLoading: questsLoading } = useQuests({ limit: 5, sortBy: 'createdAt' });

  const handleQuestGenerated = (quest: Quest) => {
    setSelectedQuest(quest);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">AI Quest Generator</h1>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.totalGenerated || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Quests Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.successRate || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.avgGenerationTime || 0}s
                  </div>
                  <div className="text-xs text-muted-foreground">Avg. Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.popularCategory || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Top Category</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <QuestGenerator onQuestGenerated={handleQuestGenerated} />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Personalized Suggestions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-powered quest ideas based on your preferences and activity
                </p>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : suggestions?.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{suggestion.difficulty}</Badge>
                            <Badge variant="secondary">{suggestion.category}</Badge>
                            <Badge variant="outline">{suggestion.estimatedTime}min</Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No suggestions available yet.</p>
                    <p className="text-sm">Complete some quests to get personalized recommendations!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6">
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
