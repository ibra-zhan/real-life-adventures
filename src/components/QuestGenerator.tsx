import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wand2, 
  Sparkles, 
  MapPin, 
  Clock, 
  Target,
  Save,
  RefreshCw
} from 'lucide-react';
import { useGenerateQuest, useGenerateQuestFromIdea, useSaveGeneratedQuest } from '@/hooks/useAIQuests';
import { useCategories } from '@/hooks/useCategories';
import type { Quest } from '@/types';
import { cn } from '@/lib/utils';

interface QuestGeneratorProps {
  onQuestGenerated?: (quest: Quest) => void;
  className?: string;
}

export function QuestGenerator({ onQuestGenerated, className }: QuestGeneratorProps) {
  const [mode, setMode] = useState<'quick' | 'custom' | 'idea'>('quick');
  const [customParams, setCustomParams] = useState({
    categoryId: '',
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC',
    count: 1,
    timeOfDay: 'afternoon' as 'morning' | 'afternoon' | 'evening' | 'night',
  });
  const [ideaParams, setIdeaParams] = useState({
    theme: '',
    description: '',
    categoryPreference: '',
    difficultyPreference: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC',
    includeLocation: false,
    targetAudience: 'everyone' as 'beginners' | 'intermediate' | 'advanced' | 'everyone',
  });
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null);

  const { data: categories } = useCategories();
  const generateQuest = useGenerateQuest();
  const generateFromIdea = useGenerateQuestFromIdea();
  const saveQuest = useSaveGeneratedQuest();

  const handleQuickGenerate = async () => {
    try {
      const quests = await generateQuest.mutateAsync({});
      if (quests.length > 0) {
        setGeneratedQuest(quests[0]);
        onQuestGenerated?.(quests[0]);
      }
    } catch (error) {
      console.error('Failed to generate quest:', error);
    }
  };

  const handleCustomGenerate = async () => {
    try {
      const quests = await generateQuest.mutateAsync(customParams);
      if (quests.length > 0) {
        setGeneratedQuest(quests[0]);
        onQuestGenerated?.(quests[0]);
      }
    } catch (error) {
      console.error('Failed to generate quest:', error);
    }
  };

  const handleIdeaGenerate = async () => {
    if (!ideaParams.theme || !ideaParams.description) return;
    
    try {
      const quest = await generateFromIdea.mutateAsync(ideaParams);
      setGeneratedQuest(quest);
      onQuestGenerated?.(quest);
    } catch (error) {
      console.error('Failed to generate quest from idea:', error);
    }
  };

  const handleSaveQuest = async () => {
    if (!generatedQuest) return;
    
    try {
      await saveQuest.mutateAsync({ 
        questData: generatedQuest, 
        autoPublish: false 
      });
    } catch (error) {
      console.error('Failed to save quest:', error);
    }
  };

  const isLoading = generateQuest.isPending || generateFromIdea.isPending || saveQuest.isPending;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mode Selection */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={mode === 'quick' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('quick')}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quick Generate
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('custom')}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-2" />
          Custom
        </Button>
        <Button
          variant={mode === 'idea' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('idea')}
          className="flex-1"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          From Idea
        </Button>
      </div>

      {/* Quick Generate */}
      {mode === 'quick' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Quick Quest Generation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate a random quest based on your preferences
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleQuickGenerate} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Random Quest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Generate */}
      {mode === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Custom Quest Generation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Specify parameters for quest generation
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={customParams.categoryId} 
                  onValueChange={(value) => setCustomParams(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={customParams.difficulty} 
                  onValueChange={(value: any) => setCustomParams(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                    <SelectItem value="EPIC">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Quests</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="5"
                  value={customParams.count}
                  onChange={(e) => setCustomParams(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeOfDay">Time of Day</Label>
                <Select 
                  value={customParams.timeOfDay} 
                  onValueChange={(value: any) => setCustomParams(prev => ({ ...prev, timeOfDay: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleCustomGenerate} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Generate Custom Quest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* From Idea */}
      {mode === 'idea' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Generate from Idea
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe your quest idea and let AI create it
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Quest Theme</Label>
              <Input
                id="theme"
                placeholder="e.g., Random Acts of Kindness"
                value={ideaParams.theme}
                onChange={(e) => setIdeaParams(prev => ({ ...prev, theme: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you want the quest to involve..."
                value={ideaParams.description}
                onChange={(e) => setIdeaParams(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryPreference">Category Preference</Label>
                <Select 
                  value={ideaParams.categoryPreference} 
                  onValueChange={(value) => setIdeaParams(prev => ({ ...prev, categoryPreference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficultyPreference">Difficulty</Label>
                <Select 
                  value={ideaParams.difficultyPreference} 
                  onValueChange={(value: any) => setIdeaParams(prev => ({ ...prev, difficultyPreference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                    <SelectItem value="EPIC">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleIdeaGenerate} 
              disabled={isLoading || !ideaParams.theme || !ideaParams.description}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Generate from Idea
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Quest Display */}
      {generatedQuest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Quest</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedQuest(null)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveQuest}
                  disabled={saveQuest.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Quest
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{generatedQuest.title}</h3>
                <p className="text-muted-foreground">{generatedQuest.shortDescription}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{generatedQuest.difficulty}</Badge>
                <Badge variant="secondary">
                  {generatedQuest.category?.name || 'Unknown Category'}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {generatedQuest.estimatedTime}m
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {generatedQuest.points} pts
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{generatedQuest.description}</p>
              </div>

              {generatedQuest.requirements && generatedQuest.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {generatedQuest.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedQuest.tags && generatedQuest.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {generatedQuest.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
