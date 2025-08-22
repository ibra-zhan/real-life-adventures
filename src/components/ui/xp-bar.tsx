import { cn } from "@/lib/utils";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  className?: string;
  showLabels?: boolean;
}

export function XPBar({ current, max, level, className, showLabels = true }: XPBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-foreground">Level {level}</span>
          <span className="text-muted-foreground">{current}/{max} XP</span>
        </div>
      )}
      <div className="xp-bar h-3">
        <div 
          className="xp-fill h-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}