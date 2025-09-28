import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuthContext } from "@/contexts/AuthContext";
import { useScreenReader, useLandmarks } from "@/hooks/useAccessibility";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthContext();
  const { announceNavigation } = useScreenReader();
  const { addLandmark, removeLandmark } = useLandmarks();
  const [isAuthenticatedRoute, setIsAuthenticatedRoute] = useState(false);

  useEffect(() => {
    // Routes that show the mobile navigation
    const authenticatedRoutes = ['/home', '/profile', '/ai-quests', '/notifications'];
    const isQuestRoute = location.pathname.startsWith('/quest/');
    setIsAuthenticatedRoute(authenticatedRoutes.includes(location.pathname) || isQuestRoute);

    // Announce page navigation for screen readers
    const pageNames: Record<string, string> = {
      '/home': 'Home',
      '/profile': 'Profile',
      '/ai-quests': 'AI Quests',
      '/notifications': 'Notifications',
      '/account-settings': 'Account Settings',
      '/privacy-settings': 'Privacy Settings',
      '/onboarding': 'Onboarding',
      '/verify-email': 'Email Verification'
    };

    const pageName = pageNames[location.pathname] ||
      (isQuestRoute ? 'Quest Details' : 'Page');

    announceNavigation(pageName);
  }, [location.pathname, announceNavigation]);

  // Redirect to login if trying to access protected routes without authentication
  useEffect(() => {
    const protectedRoutes = ['/home', '/profile', '/ai-quests', '/notifications'];
    const isQuestRoute = location.pathname.startsWith('/quest/');
    const isProtectedRoute = protectedRoutes.includes(location.pathname) || isQuestRoute;
    
    if (!isLoading && !isAuthenticated && isProtectedRoute) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Register main content landmark
  useEffect(() => {
    addLandmark('main-content', 'main', 'Main content');
    return () => removeLandmark('main-content');
  }, [addLandmark, removeLandmark]);

  return (
    <div className="relative w-full max-w-sm mx-auto bg-background">
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className="min-h-screen w-full"
      >
        {children}
      </main>
      {isAuthenticatedRoute && (
        <nav
          id="main-navigation"
          role="navigation"
          aria-label="Main navigation"
        >
          <MobileNav
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        </nav>
      )}
    </div>
  );
}