import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Star, Zap, PlayCircle, CheckCircle, Loader2 } from "lucide-react";
import type { Quest } from "@/types";
import { cn } from "@/lib/utils";
import { useStartQuest, useQuestProgress, useCompleteQuest } from "@/hooks/useQuestProgress";
import { useNavigate } from "react-router-dom";

interface QuestCardProps {
  quest: Quest;
  className?: string;
  variant?: 'default' | 'daily' | 'epic';
}

const difficultyColors = {
  EASY: 'bg-difficulty-easy text-white',
  MEDIUM: 'bg-difficulty-medium text-black',
  HARD: 'bg-difficulty-hard text-white',
  EPIC: 'bg-difficulty-epic text-white'
};

export function QuestCard({ quest, className, variant = 'default' }: QuestCardProps) {
  const navigate = useNavigate();
  const startQuestMutation = useStartQuest();
  const completeQuestMutation = useCompleteQuest();
  const { data: questProgress, isLoading: progressLoading } = useQuestProgress(quest.id);

  const isDaily = variant === 'daily';
  const isEpic = quest.difficulty === 'EPIC' || variant === 'epic';

  // Determine quest status based on progress
  const questStatus = questProgress?.status || 'NOT_STARTED';
  const isStarted = questStatus !== 'NOT_STARTED';
  const isCompleted = questStatus === 'COMPLETED';
  const isInProgress = questStatus === 'IN_PROGRESS' || questStatus === 'SUBMITTED';

  const handleQuestAction = async () => {
    if (!isStarted) {
      // Start the quest
      try {
        await startQuestMutation.mutateAsync(quest.id);
      } catch (error) {
        console.error('Failed to start quest:', error);
      }
    } else if (isInProgress) {
      // Complete the quest
      try {
        await completeQuestMutation.mutateAsync(quest.id);
      } catch (error) {
        console.error('Failed to complete quest:', error);
      }
    }
  };

  const getButtonContent = () => {
    if (startQuestMutation.isPending) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Starting...
        </>
      );
    }

    if (completeQuestMutation.isPending) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Finishing...
        </>
      );
    }

    if (isCompleted) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Completed
        </>
      );
    }

    if (isInProgress) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Finish Quest
        </>
      );
    }

    return (
      <>
        <PlayCircle className="w-4 h-4 mr-2" />
        Start Quest
      </>
    );
  };

  return (
    <Card className={cn(
      "quest-card relative overflow-hidden transition-all duration-300",
      isEpic && "quest-epic",
      isDaily && "ring-2 ring-primary",
      isCompleted && "opacity-75",
      className
    )}>
      {isDaily && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-3 py-1 text-xs font-bold rounded-br-lg">
          TODAY'S QUEST
        </div>
      )}

      {/* Quest Status Indicator */}
      {isStarted && (
        <div className={cn(
          "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium",
          isCompleted ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
        )}>
          {isCompleted ? "Completed" : "In Progress"}
        </div>
      )}

      <CardHeader className="pb-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight text-card-foreground mb-1 line-clamp-2">
              {quest.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {quest.shortDescription}
            </p>
          </div>
          <Badge className={cn("shrink-0 text-xs", difficultyColors[quest.difficulty])}>
            {quest.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{quest.estimatedTime}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 shrink-0" />
            <span>{quest.points || quest.pointsReward || 100} XP</span>
          </div>
          {quest.location?.required && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{quest.location.type}</span>
            </div>
          )}
          {isEpic && (
            <div className="flex items-center gap-1 text-difficulty-epic">
              <Star className="w-3 h-3 fill-current shrink-0" />
              <span>Epic</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {quest.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 truncate">
              {tag}
            </Badge>
          ))}
          {quest.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              +{quest.tags.length - 2}
            </Badge>
          )}
        </div>

        <Button
          onClick={handleQuestAction}
          disabled={startQuestMutation.isPending || completeQuestMutation.isPending || progressLoading || isCompleted}
          className={cn(
            "w-full btn-quest text-sm py-2",
            isEpic && "bg-gradient-to-r from-difficulty-epic to-primary",
            isCompleted && "bg-green-600 hover:bg-green-700",
            isInProgress && "bg-orange-600 hover:bg-orange-700"
          )}
        >
          {getButtonContent()}
        </Button>
      </CardContent>
    </Card>
  );
}