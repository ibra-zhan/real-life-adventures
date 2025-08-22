import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Award, Clock, ChevronRight } from "lucide-react";
import { mockChallenges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Challenges() {
  const [filter, setFilter] = useState<'all' | 'joined' | 'available'>('all');

  const filteredChallenges = mockChallenges.filter(challenge => {
    if (filter === 'joined') return challenge.isJoined;
    if (filter === 'available') return !challenge.isJoined;
    return true;
  });

  const handleJoinChallenge = (challengeId: string) => {
    console.log('Joining challenge:', challengeId);
    // In real app, make API call to join challenge
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border px-4 py-3">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Challenges
          </h1>
          <p className="text-xs text-muted-foreground">Join community adventures</p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex bg-muted/30 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'joined', label: 'Joined' },
            { id: 'available', label: 'Available' }
          ].map(({ id, label }) => (
            <Button
              key={id}
              variant={filter === id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex-1",
                filter === id && "bg-primary text-primary-foreground"
              )}
              onClick={() => setFilter(id as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Featured Challenge */}
        {filteredChallenges.length > 0 && (
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2 bg-primary text-primary-foreground">Featured</Badge>
                  <h3 className="text-xl font-bold text-foreground">
                    {filteredChallenges[0].title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {filteredChallenges[0].description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">{filteredChallenges[0].participants.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
                  <div className="text-lg font-bold">{getDaysRemaining(filteredChallenges[0].endDate)}</div>
                  <div className="text-xs text-muted-foreground">Days Left</div>
                </div>
              </div>

              {filteredChallenges[0].maxParticipants && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Participants</span>
                    <span>{filteredChallenges[0].participants}/{filteredChallenges[0].maxParticipants}</span>
                  </div>
                  <Progress 
                    value={(filteredChallenges[0].participants / filteredChallenges[0].maxParticipants) * 100}
                    className="h-2"
                  />
                </div>
              )}

              <Button 
                className={cn(
                  "w-full",
                  filteredChallenges[0].isJoined 
                    ? "bg-success text-success-foreground" 
                    : "btn-quest"
                )}
                onClick={() => !filteredChallenges[0].isJoined && handleJoinChallenge(filteredChallenges[0].id)}
                disabled={filteredChallenges[0].isJoined}
              >
                {filteredChallenges[0].isJoined ? 'Joined ✓' : 'Join Challenge'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Challenge List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">All Challenges</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground">{challenge.title}</h3>
                        {challenge.isJoined && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Joined
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{challenge.participants.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{getDaysRemaining(challenge.endDate)}d left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{challenge.quests.length} quests</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {challenge.rewards.slice(0, 3).map((badge) => (
                        <div 
                          key={badge.id}
                          className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center"
                        >
                          <Award className="w-3 h-3 text-primary" />
                        </div>
                      ))}
                      {challenge.rewards.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          +{challenge.rewards.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Button 
                      size="sm"
                      variant={challenge.isJoined ? "secondary" : "default"}
                      onClick={() => !challenge.isJoined && handleJoinChallenge(challenge.id)}
                      disabled={challenge.isJoined}
                    >
                      {challenge.isJoined ? 'View Progress' : 'Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Create Challenge CTA */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-bold mb-2">Create Your Own Challenge</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Organize a challenge for your friends or community.
            </p>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}