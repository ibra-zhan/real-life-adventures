import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "@/components/layout/mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [isAuthenticatedRoute, setIsAuthenticatedRoute] = useState(false);

  useEffect(() => {
    // Routes that show the mobile navigation
    const authenticatedRoutes = ['/home', '/profile', '/leaderboard', '/challenges'];
    setIsAuthenticatedRoute(authenticatedRoutes.includes(location.pathname));
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    window.location.href = path;
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