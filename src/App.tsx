import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppStateProvider } from "@/contexts/AppStateContext";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DefaultSkipLinks } from "@/components/SkipLinks";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { usePageTracking, useAuthTracking } from "@/hooks/useAnalytics";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AIQuests from "./pages/AIQuests";
import Notifications from "./pages/Notifications";
import QuestDetail from "./pages/QuestDetail";
import QuestSubmit from "./pages/QuestSubmit";
import QuestSuccess from "./pages/QuestSuccess";
import QuestShare from "./pages/QuestShare";
import AccountSettings from "./pages/AccountSettings";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";
import PrivacySettings from "./pages/PrivacySettings";
import EmailVerification from "./pages/EmailVerification";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  usePageTracking();
  useAuthTracking();

  return (
    <OnboardingGuard>
      <AppShell>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/quest/:id" element={<QuestDetail />} />
        <Route path="/quest/:id/submit" element={<QuestSubmit />} />
        <Route path="/quest/:id/success" element={<QuestSuccess />} />
        <Route path="/quest/:id/share" element={<QuestShare />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-quests" element={<AIQuests />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/privacy-settings" element={<PrivacySettings />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AppShell>
    </OnboardingGuard>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <AppStateProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <DefaultSkipLinks />
                <OfflineIndicator />
                <PerformanceMonitor enabled={import.meta.env.PROD} />
                <AppContent />
              </BrowserRouter>
          </TooltipProvider>
        </AppStateProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
