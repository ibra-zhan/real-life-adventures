import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppStateProvider } from "@/contexts/AppStateContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Challenges from "./pages/Challenges";
import AIQuests from "./pages/AIQuests";
import MediaManager from "./pages/MediaManager";
import Gamification from "./pages/Gamification";
import Notifications from "./pages/Notifications";
import Moderation from "./pages/Moderation";
import QuestDetail from "./pages/QuestDetail";
import QuestSubmit from "./pages/QuestSubmit";
import QuestSuccess from "./pages/QuestSuccess";
import QuestShare from "./pages/QuestShare";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <AppStateProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/ai-quests" element={<AIQuests />} />
                <Route path="/media" element={<MediaManager />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/moderation" element={<Moderation />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </AppShell>
            </BrowserRouter>
          </TooltipProvider>
        </AppStateProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
