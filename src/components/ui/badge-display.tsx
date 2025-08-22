import { Badge as UIBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Share2, Crown, Lock } from "lucide-react";
import type { Badge } from "@/types";
import { cn } from "@/lib/utils";

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

const iconMap = {
  Trophy,
  Flame,
  Share2,
  Crown,
};

const rarityStyles = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base"
};

export function BadgeDisplay({ badge, size = 'md', showProgress = false, className }: BadgeDisplayProps) {
  const IconComponent = iconMap[badge.icon as keyof typeof iconMap] || Trophy;
  const isUnlocked = !!badge.unlockedAt;
  const hasProgress = badge.progress && badge.progress.current < badge.progress.required;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn(
        "achievement-badge relative",
        sizeClasses[size],
        isUnlocked ? rarityStyles[badge.rarity] : "bg-muted/50 text-muted-foreground/50",
        !isUnlocked && "grayscale opacity-50"
      )}>
        {isUnlocked ? (
          <IconComponent className="w-1/2 h-1/2" />
        ) : (
          <Lock className="w-1/2 h-1/2" />
        )}
        
        {badge.rarity === 'legendary' && isUnlocked && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h4 className={cn(
          "font-semibold text-sm",
          isUnlocked ? "text-foreground" : "text-muted-foreground"
        )}>
          {badge.name}
        </h4>
        
        {showProgress && hasProgress && (
          <div className="w-24 space-y-1">
            <Progress 
              value={(badge.progress!.current / badge.progress!.required) * 100} 
              className="h-1"
            />
            <p className="text-xs text-muted-foreground">
              {badge.progress!.current}/{badge.progress!.required}
            </p>
          </div>
        )}
        
        <UIBadge variant="outline" className={cn(
          "text-xs px-2 py-0",
          rarityStyles[badge.rarity]
        )}>
          {badge.rarity}
        </UIBadge>
      </div>
    </div>
  );
}