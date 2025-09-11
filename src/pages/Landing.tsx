import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Flame, Trophy, Users, Star, Play, ChevronRight } from "lucide-react";

export default function Landing() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.1)_0%,_transparent_50%)]" />
        
        <div className="relative max-w-md mx-auto text-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gradient leading-tight">
              Turn Life Into<br />An Adventure
            </h1>
            <p className="text-lg text-muted-foreground">
              SideQuest transforms daily moments into exciting challenges. 
              Complete quests, earn XP, unlock achievements, and level up your life.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-xs text-muted-foreground">Active Questers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">50K+</div>
              <div className="text-xs text-muted-foreground">Quests Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">95%</div>
              <div className="text-xs text-muted-foreground">Fun Rating</div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button 
              className="w-full btn-quest text-lg py-6"
              onClick={handleGetStarted}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Your Adventure
            </Button>
            <Button 
              variant="outline"
              className="w-full text-lg py-6"
              onClick={handleLogin}
            >
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground">
              Free to play • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 max-w-md mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground">
            Three simple steps to gamify your daily life
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <Card className="quest-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Discover Quests</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized daily challenges based on your mood, location, and interests. 
                    From random acts of kindness to creative adventures.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">Kindness</Badge>
                    <Badge variant="secondary" className="text-xs">Photography</Badge>
                    <Badge variant="secondary" className="text-xs">+10 more</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="quest-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-success font-bold text-lg">2</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Complete Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    Take on real-world quests and submit proof through photos, videos, or reflection. 
                    Each completion earns XP and builds your streak.
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="w-3 h-3" />
                      <span>Earn XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      <Flame className="w-3 h-3" />
                      <span>Build Streaks</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="quest-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-warning font-bold text-lg">3</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Level Up & Share</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock achievements, climb leaderboards, and share your victories. 
                    Connect with a community of fellow adventurers.
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-warning">
                      <Trophy className="w-3 h-3" />
                      <span>Achievements</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <Users className="w-3 h-3" />
                      <span>Community</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Quest Preview */}
      <section className="px-4 py-16 max-w-md mx-auto">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-foreground">Sample Quest</h2>
          <p className="text-muted-foreground">Here's what a typical quest looks like</p>
        </div>

        <Card className="quest-card bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">Coffee Shop Compliment</h3>
                  <p className="text-sm text-muted-foreground">
                    Brighten a barista's day with a genuine compliment
                  </p>
                </div>
                <Badge className="bg-difficulty-easy text-white">Easy</Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>⏱️ 15 min</span>
                <span>⚡ 100 XP</span>
                <span>📍 Any location</span>
              </div>

              <div className="bg-background/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  Visit a local coffee shop and genuinely compliment the barista on something specific. 
                  Take a photo of your drink as proof!
                </p>
              </div>

              <Button className="w-full btn-quest">
                <Play className="w-4 h-4 mr-2" />
                Try This Quest
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-16 max-w-md mx-auto">
        <div className="text-center space-y-8">
          <h2 className="text-2xl font-bold text-foreground">Join the Adventure</h2>
          
          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary fill-current" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">"SideQuest made me more social and adventurous!"</p>
                    <p className="text-xs text-muted-foreground">- Alex, Level 12 Quester</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-success fill-current" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">"I've discovered so many new hobbies through quests."</p>
                    <p className="text-xs text-muted-foreground">- Maya, 45-day streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full btn-quest text-lg py-6"
              onClick={handleGetStarted}
            >
              Start Your Free Adventure
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              className="w-full text-lg py-6"
              onClick={handleLogin}
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-xs text-muted-foreground border-t border-border">
        <p>© 2024 SideQuest. Made with ❤️ for adventurers everywhere.</p>
      </footer>
    </div>
  );
}