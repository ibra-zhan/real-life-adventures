import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Only run onboarding check for authenticated users
    if (!isAuthenticated || !user) {
      return;
    }

    // Skip onboarding check for certain routes
    const skipRoutes = [
      '/onboarding',
      '/verify-email',
      '/login',
      '/register',
      '/'
    ];

    if (skipRoutes.includes(location.pathname)) {
      return;
    }

    // If user hasn't completed onboarding, redirect to onboarding
    if (!user.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, isAuthenticated, location.pathname, navigate]);

  return <>{children}</>;
}