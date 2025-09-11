import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Download, 
  Share2,
  Smartphone,
  Square,
  Eye,
  Sparkles
} from "lucide-react";
import { ShareCard } from "@/components/ui/share-card";
import { ShareCardGenerator, type ShareCardData, type ShareOptions } from "@/lib/share-generator";
import { useUser } from "@/contexts/UserContext";
import { calculateQuestRewards } from "@/lib/progression";
import type { Quest } from "@/types";

interface LocationState {
  quest: Quest;
  submissionData: {
    mediaUrl: string;
    caption: string;
    includeLocation: boolean;
    privacy: string;
  };
}

export default function QuestShare() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: userState } = useUser();
  
  const [format, setFormat] = useState<'1:1' | '9:16'>('1:1');
  const [template, setTemplate] = useState<'minimal' | 'achievement' | 'streak'>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const state = location.state as LocationState;
  const user = userState.user;
  
  // Calculate rewards and share data
  const rewards = useMemo(() => {
    if (!state?.quest) return null;
    return calculateQuestRewards(state.quest, user);
  }, [state?.quest, user]);

  const shareData = useMemo((): ShareCardData | null => {
    if (!state?.quest || !rewards) return null;
    
    return {
      quest: state.quest,
      user,
      xpGained: rewards.totalXP,
      newStreak: rewards.newStreak > 1 ? rewards.newStreak : undefined,
      unlockedBadge: rewards.unlockedBadges[0] // Show first unlocked badge
    };
  }, [state?.quest, user, rewards]);

  // Set recommended options on mount
  useEffect(() => {
    if (shareData) {
      const recommendedFormat = ShareCardGenerator.getRecommendedFormat(shareData);
      const recommendedTemplate = ShareCardGenerator.getRecommendedTemplate(shareData);
      setFormat(recommendedFormat);
      setTemplate(recommendedTemplate);
    }
  }, [shareData]);

  const handleGenerateCard = useCallback(async (downloadFormat: '1:1' | '9:16') => {
    if (!shareCardRef.current) {
      toast.error("Share card not ready. Please try again.");
      return;
    }

    if (!ShareCardGenerator.isSupported()) {
      toast.error("Share card generation is not supported in this browser.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const element = shareCardRef.current;
      
      // Prepare element for export
      ShareCardGenerator.prepareElementForExport(element);
      
      // Small delay to ensure layout is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const options: ShareOptions = {
        format: downloadFormat,
        template,
        quality: 1.0,
        fileType: 'png'
      };
      
      await ShareCardGenerator.generateAndDownload(element, shareData, options);
      
      toast.success(`Share card downloaded! (${downloadFormat} format)`, {
        description: "Check your downloads folder",
        duration: 4000,
      });
      
    } catch (error) {
      console.error('Share generation error:', error);
      toast.error("Failed to generate share card. Please try again.");
    } finally {
      // Cleanup
      if (shareCardRef.current) {
        ShareCardGenerator.cleanupAfterExport(shareCardRef.current);
      }
      setIsGenerating(false);
    }
  }, [shareData, template]);

  // Early return after all hooks
  if (!state) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Share Data Found</h2>
          <p className="text-muted-foreground mb-4">Please complete a quest first.</p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!shareData || !rewards) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground mb-4">Preparing your share card...</p>
        </div>
      </div>
    );
  }

  const { quest } = state;

  const handleShare = useCallback(() => {
    // Web Share API for native sharing
    if (navigator.share) {
      navigator.share({
        title: `I completed "${quest.title}" on SideQuest!`,
        text: `Just earned ${rewards.totalXP} XP and ${rewards.newStreak > 1 ? `a ${rewards.newStreak}-day streak` : 'completed my quest'}! 🚀`,
        url: window.location.origin
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const text = `I completed "${quest.title}" on SideQuest! Just earned ${rewards.totalXP} XP 🚀 ${window.location.origin}`;
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Share text copied to clipboard!");
      }).catch(() => {
        toast.error("Failed to copy share text");
      });
    }
  }, [quest.title, rewards.totalXP, rewards.newStreak]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/quest/${id}/success`)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">Share Achievement</h1>
            <p className="text-sm text-muted-foreground truncate">Create your share card</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Preview Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="transform scale-75 origin-center">
                <ShareCard
                  ref={shareCardRef}
                  quest={shareData.quest}
                  user={shareData.user}
                  xpGained={shareData.xpGained}
                  newStreak={shareData.newStreak}
                  unlockedBadge={shareData.unlockedBadge}
                  format={format}
                  template={template}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customization Options */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Customize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={format} onValueChange={(value: '1:1' | '9:16') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Square (1:1)</div>
                        <div className="text-xs text-muted-foreground">Perfect for Instagram posts</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="9:16">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Story (9:16)</div>
                        <div className="text-xs text-muted-foreground">Great for Instagram/TikTok stories</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Style</label>
              <Select value={template} onValueChange={(value: 'minimal' | 'achievement' | 'streak') => setTemplate(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">
                    <div>
                      <div className="font-medium">Minimal</div>
                      <div className="text-xs text-muted-foreground">Clean and simple</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="achievement">
                    <div>
                      <div className="font-medium">Achievement</div>
                      <div className="text-xs text-muted-foreground">Celebrate milestones</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="streak">
                    <div>
                      <div className="font-medium">Streak</div>
                      <div className="text-xs text-muted-foreground">Highlight consistency</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recommended Badge */}
            {rewards.unlockedBadges.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Badge unlocked! Perfect for sharing</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download Both Formats */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => handleGenerateCard('1:1')}
              disabled={isGenerating}
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Square className="w-5 h-5" />
              <span className="text-xs">Download Square</span>
            </Button>
            
            <Button 
              onClick={() => handleGenerateCard('9:16')}
              disabled={isGenerating}
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">Download Story</span>
            </Button>
          </div>

          {/* Primary Download Button */}
          <Button 
            onClick={() => handleGenerateCard(format)}
            disabled={isGenerating}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download {format} Share Card
              </>
            )}
          </Button>

          {/* Share Button */}
          <Button 
            onClick={handleShare}
            variant="outline"
            className="w-full"
            disabled={isGenerating}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Achievement
          </Button>

          {/* Navigation */}
          <Button 
            variant="ghost"
            onClick={() => navigate('/home')}
            className="w-full"
            disabled={isGenerating}
          >
            Continue Questing
          </Button>
        </div>
      </div>
    </div>
  );
}
