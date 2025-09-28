import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles,
  Target,
  Save,
  RefreshCw
} from 'lucide-react';
import { useGenerateQuest, useSaveGeneratedQuest } from '@/hooks/useAIQuests';
import { useRandomQuest } from '@/hooks/useQuests';
import { useCategories } from '@/hooks/useCategories';
import type { Quest } from '@/types';
import { cn } from '@/lib/utils';

interface QuestGeneratorProps {
  onQuestGenerated?: (quest: Quest) => void;
  className?: string;
}

export function QuestGenerator({ onQuestGenerated, className }: QuestGeneratorProps) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [customParams, setCustomParams] = useState({
    categoryId: '',
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC',
  });
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null);

  const { data: categories } = useCategories();
  const generateQuest = useGenerateQuest();
  const saveQuest = useSaveGeneratedQuest();
  const randomQuestMutation = useRandomQuest();

  const handleQuickGenerate = async () => {
    try {
      const quest = await randomQuestMutation.mutateAsync(undefined);
      setGeneratedQuest(quest);
      onQuestGenerated?.(quest);
    } catch (error) {
      console.error('Failed to generate random quest:', error);
    }
  };

  const handleCustomGenerate = async () => {
    try {
      const generationData = {
        mode: 'custom' as const,
        difficulty: customParams.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard' | 'epic',
        category: customParams.categoryId ? 
          (categories?.find(c => c.id === customParams.categoryId)?.name.toLowerCase() === 'fitness' ? 'fitness' : 'learning') : 
          undefined,
        count: 1,
      };
      
      const quests = await generateQuest.mutateAsync(generationData);
      if (quests.length > 0) {
        setGeneratedQuest(quests[0]);
        onQuestGenerated?.(quests[0]);
      }
    } catch (error) {
      console.error('Failed to generate quest:', error);
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

  const isLoading = generateQuest.isPending || saveQuest.isPending || randomQuestMutation.isPending;

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


      {/* Generated Quest Actions */}
      {generatedQuest && (
        <div className="flex gap-2 justify-end">
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
      )}
    </div>
  );
}
