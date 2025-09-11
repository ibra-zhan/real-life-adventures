import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Clock, 
  Zap, 
  MapPin, 
  Users, 
  CheckCircle2,
  Play,
  Upload
} from "lucide-react";
import { useQuest } from "@/hooks/useQuests";
import { cn } from "@/lib/utils";
import type { QuestDifficulty } from "@/types";

const difficultyConfig: Record<QuestDifficulty, { color: string; label: string }> = {
  EASY: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Easy" },
  MEDIUM: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Medium" },
  HARD: { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Hard" },
  EPIC: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Epic" }
};

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: quest, isLoading, error } = useQuest(id);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !quest) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quest Not Found</h2>
          <p className="text-muted-foreground mb-4">The quest you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const difficultyStyle = difficultyConfig[quest.difficulty];

  const handleStartQuest = () => {
    // TODO: Implement quest start logic
    console.log('Starting quest:', quest.id);
    // For now, just navigate to submit page
    navigate(`/quest/${quest.id}/submit`);
  };

  const handleSubmitProof = () => {
    navigate(`/quest/${quest.id}/submit`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">Quest Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Quest Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <CardTitle className="text-xl leading-tight">{quest.title}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={cn("border", difficultyStyle.color)}
                  >
                    {difficultyStyle.label}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {quest.category?.name || 'Unknown Category'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Quest Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm font-medium">{quest.points}</div>
                <div className="text-xs text-muted-foreground">Points</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">{quest.estimatedTime}m</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  {quest.locationRequired ? (
                    <MapPin className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Users className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="text-sm font-medium">
                  {quest.locationRequired ? (quest.locationType || 'Any') : 'Flexible'}
                </div>
                <div className="text-xs text-muted-foreground">Location</div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {quest.description}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="font-semibold mb-3">Requirements</h3>
              <div className="space-y-2">
                {quest.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {quest.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {quest.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {quest.status === 'available' && (
            <Button 
              onClick={handleStartQuest}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Quest
            </Button>
          )}
          
          {quest.status === 'active' && (
            <Button 
              onClick={handleSubmitProof}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Submit Proof
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/home')}
            className="w-full"
          >
            Back to Quests
          </Button>
        </div>

        {/* Social Sharing Info */}
        {quest.social?.encourageSharing && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  This quest encourages sharing your completion with the community!
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
