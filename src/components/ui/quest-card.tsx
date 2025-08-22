import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Star, Zap } from "lucide-react";
import type { Quest } from "@/types";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: Quest;
  onStart?: (questId: string) => void;
  className?: string;
  variant?: 'default' | 'daily' | 'epic';
}

const difficultyColors = {
  easy: 'bg-difficulty-easy text-white',
  medium: 'bg-difficulty-medium text-black',
  hard: 'bg-difficulty-hard text-white',
  epic: 'bg-difficulty-epic text-white'
};

export function QuestCard({ quest, onStart, className, variant = 'default' }: QuestCardProps) {
  const isDaily = variant === 'daily';
  const isEpic = quest.difficulty === 'epic' || variant === 'epic';

  return (
    <Card className={cn(
      "quest-card relative overflow-hidden transition-all duration-300",
      isEpic && "quest-epic",
      isDaily && "ring-2 ring-primary",
      className
    )}>
      {isDaily && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-3 py-1 text-xs font-bold rounded-br-lg">
          TODAY'S QUEST
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight text-card-foreground mb-2">
              {quest.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {quest.shortDescription}
            </p>
          </div>
          <Badge className={cn("shrink-0", difficultyColors[quest.difficulty])}>
            {quest.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{quest.estimatedTime}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{quest.points} XP</span>
          </div>
          {quest.location?.required && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{quest.location.type}</span>
            </div>
          )}
          {isEpic && (
            <div className="flex items-center gap-1 text-difficulty-epic">
              <Star className="w-3 h-3 fill-current" />
              <span>Epic</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {quest.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
              {tag}
            </Badge>
          ))}
          {quest.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              +{quest.tags.length - 3}
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => onStart?.(quest.id)}
          className={cn(
            "w-full btn-quest",
            isEpic && "bg-gradient-to-r from-difficulty-epic to-primary"
          )}
        >
          {quest.status === 'active' ? 'Continue Quest' : 'Start Quest'}
        </Button>
      </CardContent>
    </Card>
  );
}