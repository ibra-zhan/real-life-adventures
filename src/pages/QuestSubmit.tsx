import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Upload, 
  Image, 
  Video, 
  MapPin, 
  Eye,
  EyeOff,
  Users,
  Lock
} from "lucide-react";
import { mockQuests } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { SubmissionType } from "@/types";

// Zod schema for form validation
const submissionSchema = z.object({
  mediaUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Media URL is required"),
  caption: z
    .string()
    .min(10, "Caption must be at least 10 characters")
    .max(280, "Caption must be less than 280 characters"),
  includeLocation: z.boolean().default(false),
  privacy: z.enum(["public", "friends", "private"]).default("public"),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

const privacyOptions = [
  { value: "public", label: "Public", icon: Users, description: "Everyone can see" },
  { value: "friends", label: "Friends Only", icon: Eye, description: "Only friends can see" },
  { value: "private", label: "Private", icon: Lock, description: "Only you can see" },
];

export default function QuestSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitQuest, state } = useUser();
  
  const quest = mockQuests.find(q => q.id === id);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      mediaUrl: "",
      caption: "",
      includeLocation: false,
      privacy: "public",
    }
  });

  const isLoading = isSubmitting || state.isLoading;

  const watchedCaption = watch("caption");
  const watchedPrivacy = watch("privacy");
  const watchedLocation = watch("includeLocation");

  if (!quest) {
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

  const onSubmit = async (data: SubmissionFormData) => {
    if (!quest) return;
    
    try {
      // Use the optimistic update system
      await submitQuest(quest, data);
      
      // Success - navigate to success page
      navigate(`/quest/${id}/success`, { 
        state: { 
          submissionData: data,
          quest: quest 
        }
      });
      
    } catch (error) {
      // Error handling is done in the UserContext
      console.error("Quest submission error:", error);
    }
  };

  const getSubmissionTypeIcon = (type: SubmissionType) => {
    switch (type) {
      case 'photo': return Image;
      case 'video': return Video;
      default: return Upload;
    }
  };

  const selectedPrivacy = privacyOptions.find(option => option.value === watchedPrivacy);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/quest/${id}`)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">Submit Proof</h1>
            <p className="text-sm text-muted-foreground truncate">{quest.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Quest Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quest Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{quest.difficulty}</Badge>
                  <Badge variant="secondary">{quest.category?.name || 'Unknown Category'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{quest.shortDescription}</p>
                <div className="flex items-center gap-2 text-sm">
                  {quest.submissionTypes.map((type, index) => {
                    const Icon = getSubmissionTypeIcon(type);
                    return (
                      <div key={type} className="flex items-center gap-1">
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{type}</span>
                        {index < quest.submissionType.length - 1 && (
                          <span className="mx-1 text-muted-foreground">•</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Media Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="mediaUrl">
                  Media URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mediaUrl"
                  type="url"
                  placeholder="https://example.com/your-photo.jpg"
                  {...register("mediaUrl")}
                  className={cn(errors.mediaUrl && "border-destructive")}
                />
                {errors.mediaUrl && (
                  <p className="text-sm text-destructive mt-1">{errors.mediaUrl.message}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your photo/video to a service like Imgur, Google Drive, or Dropbox and paste the link here.
              </p>
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Caption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="caption">
                  Describe your experience <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="caption"
                  placeholder="Tell us about your quest experience..."
                  rows={4}
                  {...register("caption")}
                  className={cn(errors.caption && "border-destructive")}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.caption ? (
                    <p className="text-sm text-destructive">{errors.caption.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Share what you learned or how it felt
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {watchedCaption.length}/280
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="includeLocation" className="text-sm font-medium">
                    Include location in submission
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Help others discover quests near them
                  </p>
                </div>
                <Switch
                  id="includeLocation"
                  checked={watchedLocation}
                  onCheckedChange={(checked) => setValue("includeLocation", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="privacy">Who can see this submission?</Label>
                <Select
                  value={watchedPrivacy}
                  onValueChange={(value: "public" | "friends" | "private") => 
                    setValue("privacy", value)
                  }
                >
                  <SelectTrigger id="privacy">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {selectedPrivacy && (
                          <>
                            <selectedPrivacy.icon className="w-4 h-4" />
                            <span>{selectedPrivacy.label}</span>
                          </>
                        )}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {privacyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Button */}
          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {state.isLoading ? "Processing..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Quest Proof
                </>
              )}
            </Button>
            
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate(`/quest/${id}`)}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
