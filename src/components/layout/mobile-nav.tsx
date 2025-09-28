import { Home, User, Wand2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/ai-quests', icon: Wand2, label: 'AI Quests' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/profile', icon: User, label: 'Profile' }
];

export function MobileNav({ currentPath, onNavigate }: MobileNavProps) {

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-sm mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = currentPath === path;

          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0",
                isActive && "drop-shadow-glow"
              )} />
              <span className="text-xs font-medium truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}