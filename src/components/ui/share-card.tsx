import React, { forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Trophy, Flame, Star } from 'lucide-react';
import type { Quest, User, Badge as BadgeType } from '@/types';
import { cn } from '@/lib/utils';

interface ShareCardProps {
  quest: Quest;
  user: User;
  xpGained: number;
  newStreak?: number;
  unlockedBadge?: BadgeType;
  format: '1:1' | '9:16';
  template?: 'minimal' | 'achievement' | 'streak';
  className?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({
  quest,
  user,
  xpGained,
  newStreak,
  unlockedBadge,
  format,
  template = 'minimal',
  className
}, ref) => {
  const isSquare = format === '1:1';
  const isStory = format === '9:16';

  const containerClass = cn(
    "relative overflow-hidden text-white font-sans",
    isSquare && "w-[400px] h-[400px]",
    isStory && "w-[400px] h-[711px]", // 9:16 ratio
    className
  );

  const backgroundGradient = template === 'achievement' 
    ? "bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"
    : template === 'streak'
    ? "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
    : "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700";

  return (
    <div ref={ref} className={containerClass}>
      {/* Background */}
      <div className={cn("absolute inset-0", backgroundGradient)} />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-white/20 blur-xl" />
        <div className="absolute bottom-12 left-8 w-24 h-24 rounded-full bg-white/15 blur-lg" />
        {isStory && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold">{user.username.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-white/80 text-sm">Level {user.level} Quester</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center text-center space-y-6">
          {/* Quest Title */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Quest Complete</span>
            </div>
            <h1 className={cn(
              "font-bold text-white leading-tight mb-3",
              isSquare ? "text-xl" : "text-2xl"
            )}>
              {quest.title}
            </h1>
            <Badge 
              className={cn(
                "bg-white/20 text-white border-white/30",
                quest.difficulty === 'epic' && "bg-yellow-400/30 text-yellow-100 border-yellow-300/50"
              )}
            >
              {quest.difficulty.toUpperCase()}
            </Badge>
          </div>

          {/* Rewards */}
          <div className="space-y-4">
            {/* XP Gained */}
            <div className="flex items-center justify-center gap-3 bg-white/10 rounded-2xl py-4 px-6">
              <Zap className="w-6 h-6 text-yellow-300" />
              <div>
                <div className="text-2xl font-bold text-yellow-300">+{xpGained}</div>
                <div className="text-sm text-white/80">XP Earned</div>
              </div>
            </div>

            {/* Streak */}
            {newStreak && newStreak > 1 && (
              <div className="flex items-center justify-center gap-3 bg-white/10 rounded-2xl py-4 px-6">
                <Flame className="w-6 h-6 text-orange-300" />
                <div>
                  <div className="text-2xl font-bold text-orange-300">{newStreak}</div>
                  <div className="text-sm text-white/80">Day Streak</div>
                </div>
              </div>
            )}

            {/* Badge Unlock */}
            {unlockedBadge && (
              <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl py-4 px-6 border border-yellow-300/30">
                <div className="flex items-center justify-center gap-3">
                  <Star className="w-6 h-6 text-yellow-300" />
                  <div>
                    <div className="text-lg font-bold text-yellow-300">Badge Unlocked!</div>
                    <div className="text-sm text-white/90">{unlockedBadge.name}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="mb-4">
            <div className="text-lg font-bold">SideQuest</div>
            <div className="text-sm text-white/70">Level up your life</div>
          </div>
          
          {/* Category Tags */}
          <div className="flex justify-center gap-2">
            <span className="text-xs text-white/60">#{quest.category.toLowerCase()}</span>
            {quest.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-white/60">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export { ShareCard };
export type { ShareCardProps };
