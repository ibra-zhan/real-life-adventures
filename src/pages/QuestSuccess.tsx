import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Zap, 
  Flame, 
  Trophy, 
  Share2,
  Download,
  Home,
  Sparkles
} from "lucide-react";
import { mockUser, mockBadges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Quest } from "@/types";

interface LocationState {
  submissionData: {
    mediaUrl: string;
    caption: string;
    includeLocation: boolean;
    privacy: string;
  };
  quest: Quest;
}

export default function QuestSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCelebration, setShowCelebration] = useState(true);
  
  const state = location.state as LocationState;
  
  // If no state, redirect back to home
  useEffect(() => {
    if (!state) {
      navigate('/home');
    }
  }, [state, navigate]);

  useEffect(() => {
    // Hide celebration after 3 seconds
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!state) {
    return null; // Will redirect via useEffect
  }

  const { quest, submissionData } = state;
  
  // Calculate rewards (mock logic)
  const baseXP = quest.points;
  const bonusXP = quest.difficulty === 'epic' ? Math.floor(baseXP * 0.5) : 0;
  const totalXP = baseXP + bonusXP;
  
  // Mock streak increment
  const newStreak = mockUser.currentStreak + 1;
  
  // Check for badge unlock (simple logic)
  const unlockedBadge = newStreak === 7 ? mockBadges.find(b => b.name === "Week Warrior") : null;

  const handleGenerateShareCard = () => {
    navigate(`/quest/${id}/share`, { state: { quest, submissionData } });
  };

  const handleShareAchievement = () => {
    // TODO: Implement social sharing
    console.log('Sharing achievement:', quest.title);
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-100">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="absolute top-1/2 left-1/3 animate-bounce delay-200">
            <Sparkles className="w-5 h-5 text-green-400" />
          </div>
          <div className="absolute top-1/4 right-1/3 animate-bounce delay-300">
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient mb-2">Quest Complete!</h1>
            <p className="text-muted-foreground">
              Amazing work on completing "{quest.title}"
            </p>
          </div>
        </div>

        {/* Rewards Summary */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Rewards Earned
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* XP Reward */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-medium">Experience Points</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">+{totalXP} XP</div>
                {bonusXP > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ({baseXP} base + {bonusXP} bonus)
                  </div>
                )}
              </div>
            </div>

            {/* Streak Reward */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Quest Streak</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-500">{newStreak} days</div>
                <div className="text-xs text-muted-foreground">
                  +1 day streak
                </div>
              </div>
            </div>

            {/* Badge Unlock */}
            {unlockedBadge && (
              <>
                <Separator />
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-600">New Badge Unlocked!</div>
                      <div className="text-sm text-muted-foreground">{unlockedBadge.name}</div>
                    </div>
                    <Badge className="bg-yellow-500 text-yellow-50">
                      {unlockedBadge.rarity}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Submission Summary */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Your Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Caption</div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {submissionData.caption}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Privacy</span>
              <Badge variant="outline" className="capitalize">
                {submissionData.privacy}
              </Badge>
            </div>
            
            {submissionData.includeLocation && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <Badge variant="outline">Included</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Share Your Achievement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleGenerateShareCard}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Share Card
            </Button>
            
            <Button 
              onClick={handleShareAchievement}
              className="w-full"
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share to Social Media
            </Button>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/home')}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Continue Questing
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate(`/quest/${id}`)}
            className="w-full"
          >
            View Quest Details
          </Button>
        </div>

        {/* Encouragement */}
        <Card className="bg-muted/30 text-center">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Keep up the great work! Every quest completed makes you stronger and helps you level up your life.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
