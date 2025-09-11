import { Home, Trophy, Users, User, LogOut, Wand2, Image, Star, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/ai-quests', icon: Wand2, label: 'AI Quests' },
  { path: '/media', icon: Image, label: 'Media' },
  { path: '/gamification', icon: Star, label: 'Progress' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/moderation', icon: Shield, label: 'Moderation' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/challenges', icon: Users, label: 'Challenges' },
  { path: '/profile', icon: User, label: 'Profile' }
];

export function MobileNav({ currentPath, onNavigate }: MobileNavProps) {
  const { logout, user } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = currentPath === path;
          
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive && "drop-shadow-glow"
              )} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
        
        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </Button>
      </div>
    </nav>
  );
}