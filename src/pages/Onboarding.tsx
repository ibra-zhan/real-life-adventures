import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Camera,
  Users,
  CheckCircle,
  Trophy,
  Heart,
  Zap
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, updateUser: updateAuthUser } = useAuthContext();
  const { updateUser: updateUserState } = useUser();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [completionPreference, setCompletionPreference] = useState<'public' | 'friends' | 'private'>('public');

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SideQuest!',
      description: 'Turn everyday moments into meaningful adventures',
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gradient">Welcome to SideQuest!</h2>
            <p className="text-muted-foreground">
              Transform your daily life into an adventure with bite-sized quests that inspire growth, creativity, and connection.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <Target className="w-6 h-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Complete Quests</p>
            </div>
            <div className="space-y-2">
              <Camera className="w-6 h-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Share Moments</p>
            </div>
            <div className="space-y-2">
              <Trophy className="w-6 h-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Grow Together</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quest-types',
      title: 'Choose Your Adventures',
      description: 'What kinds of quests interest you most?',
      icon: <Target className="w-8 h-8 text-primary" />,
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold">What interests you?</h2>
            <p className="text-muted-foreground text-sm">
              Select the types of quests you'd like to see more often. You can always change this later.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'kindness', label: 'Kindness', icon: Heart, color: 'bg-rose-100 text-rose-700 border-rose-200' },
              { id: 'creativity', label: 'Creativity', icon: Sparkles, color: 'bg-purple-100 text-purple-700 border-purple-200' },
              { id: 'mindfulness', label: 'Mindfulness', icon: Target, color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { id: 'photography', label: 'Photography', icon: Camera, color: 'bg-green-100 text-green-700 border-green-200' },
              { id: 'social', label: 'Social', icon: Users, color: 'bg-orange-100 text-orange-700 border-orange-200' },
              { id: 'fitness', label: 'Fitness', icon: Zap, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
            ].map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${isSelected ? '' : category.color}`}
                  onClick={() => {
                    setSelectedCategories(prev =>
                      prev.includes(category.id)
                        ? prev.filter(c => c !== category.id)
                        : [...prev, category.id]
                    );
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{category.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Your Privacy Matters',
      description: 'Choose how you want to share your quest completions',
      icon: <Users className="w-8 h-8 text-primary" />,
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold">How do you want to share?</h2>
            <p className="text-muted-foreground text-sm">
              Choose your default sharing preference. You can always change this for individual quests.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'public',
                title: 'Public',
                description: 'Share with everyone and inspire others',
                icon: '🌍'
              },
              {
                id: 'friends',
                title: 'Friends Only',
                description: 'Share with friends and family',
                icon: '👥'
              },
              {
                id: 'private',
                title: 'Private',
                description: 'Keep your quests just for you',
                icon: '🔒'
              }
            ].map((option) => (
              <Button
                key={option.id}
                variant={completionPreference === option.id ? "default" : "outline"}
                className="w-full h-auto p-4 justify-start"
                onClick={() => setCompletionPreference(option.id as any)}
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <div className="font-medium">{option.title}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'ready',
      title: 'You\'re All Set!',
      description: 'Ready to start your first quest?',
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gradient">You're Ready!</h2>
            <p className="text-muted-foreground">
              Your profile is set up and ready to go. Let's start your first quest and begin your adventure!
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">What's next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Browse featured quests</li>
              <li>• Complete your first quest</li>
              <li>• Share your experience</li>
              <li>• Earn achievements</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    // Check if user has already completed onboarding
    if (authUser?.onboardingCompleted) {
      navigate('/home');
    }
  }, [authUser, navigate]);

  const handleNext = async () => {
    if (isLastStep) {
      await completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Update user preferences
      await updateUserState({
        preferredCategories: selectedCategories,
        defaultPrivacy: completionPreference,
        onboardingCompleted: true
      });

      updateAuthUser({
        preferredCategories: selectedCategories,
        defaultPrivacy: completionPreference,
        onboardingCompleted: true,
      });

      toast({
        title: "Welcome aboard!",
        description: "Your account is all set up. Let's start your first quest!",
      });

      // Navigate to home
      navigate('/home');

    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: "Setup Error",
        description: "Failed to save your preferences. You can update them later in settings.",
        variant: "destructive",
      });

      // Still navigate to home even if preferences failed to save
      navigate('/home');
    }
  };

  const skipOnboarding = async () => {
    try {
      await updateUserState({
        onboardingCompleted: true
      });
      updateAuthUser({ onboardingCompleted: true });
      navigate('/home');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
              {currentStepData.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">Setup</h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <Progress value={progress} className="h-2" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Step Content */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-8">
          <CardContent className="p-6">
            {currentStepData.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentStep === 1 && selectedCategories.length === 0}
            className="flex-1"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}