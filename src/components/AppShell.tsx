import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuthContext } from "@/contexts/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [isAuthenticatedRoute, setIsAuthenticatedRoute] = useState(false);

  useEffect(() => {
    // Routes that show the mobile navigation
    const authenticatedRoutes = ['/home', '/profile', '/leaderboard', '/challenges', '/ai-quests', '/media', '/gamification', '/notifications', '/moderation'];
    const isQuestRoute = location.pathname.startsWith('/quest/');
    setIsAuthenticatedRoute(authenticatedRoutes.includes(location.pathname) || isQuestRoute);
  }, [location.pathname]);

  // Redirect to login if trying to access protected routes without authentication
  useEffect(() => {
    const protectedRoutes = ['/home', '/profile', '/leaderboard', '/challenges', '/ai-quests', '/media', '/gamification', '/notifications', '/moderation'];
    const isQuestRoute = location.pathname.startsWith('/quest/');
    const isProtectedRoute = protectedRoutes.includes(location.pathname) || isQuestRoute;
    
    if (!isLoading && !isAuthenticated && isProtectedRoute) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="relative">
      {children}
      {isAuthenticatedRoute && (
        <MobileNav 
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}