import { geminiService } from './geminiService';
import { prisma } from '@/services/database';
import type { QuestDifficulty } from '@prisma/client';

// Define the expected output structure from the AI
interface AIQuestOutput {
  title: string;
  shortDescription: string;
  category: 'fitness' | 'learning';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  duration_min: number;
  description: string;
  safety_notes: string;
  proof: string[];
  xp: number;
}

// Input for quest generation
export interface QuestGenerationInput {
  mode: 'quick' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  category?: 'fitness' | 'learning';
  userId?: string; // Optional for personalization
}

// Internal representation of a generated quest
export interface GeneratedQuest {
  title: string;
  description: string; // This will be the full description from AI
  shortDescription: string;
  instructions?: string; // This will be derived from safety_notes
  categoryId: string;
  difficulty: QuestDifficulty; // Uppercase for Prisma
  tags: string[];
  requirements: string[]; // This will be derived from proof
  estimatedTime: number;
  submissionTypes: ('PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST')[];
  locationRequired: boolean;
  locationType?: 'indoor' | 'outdoor' | 'specific' | undefined;
  specificLocation?: string;
  allowSharing: boolean;
  complexity?: number;
  socialAspect?: boolean;
}

class AIQuestGenerator {
  private lastGeneratedCategory: 'fitness' | 'learning' | null = null;

  private getSystemPrompt(): string {
    return `
# Role

**SideQuest** is a mobile-first app that gives people **real-life mini-challenges ("quests")** they can do today, then rewards them with **XP, streaks, and badges** and lets them **share** wins.

You are the **Random Quest Generator**. On each call, return **one universally doable quest** (no equipment, no cost). Quests are either **fitness** (walk/run/bodyweight, "local explorer" style) or **learning** (study from free resources). Scale difficulty strictly by the user's choice and keep results diverse across calls.

---

## Inputs

* \`mode\`: \`"quick" | "custom"\`
* \`difficulty\`: \`"easy" | "medium" | "hard" | "epic"\`
* \`category\` (optional for custom): \`"fitness" | "learning"\`

---

## Global Rules

* Output **one** quest only.
* Keep copy **concise and actionable**.
* Distances must show **km and miles**.
* Always include a **safe, low-impact alternative** for fitness.
* Maintain **diversity**: rotate templates; don't repeat the exact template back-to-back (if category not given, alternate fitness/learning).

---

## Difficulty Scaling

* **XP:** easy=50, medium=100, hard=150, epic=250
* **Learning time:** easy 20–25 min · medium 40–50 · hard 75–90 · epic 120–150
* **Run distance:** easy 2 km (1.2 mi) · medium 5 km (3.1 mi) · hard 10 km (6.2 mi) · epic 15 km (9.3 mi)
* **Power-walk ("Local Explorer") time:** easy 20 min · medium 35 · hard 60 · epic 90
* **Bodyweight circuit (rounds x reps):**

  * easy: 2r — 10 squats, 6 push-ups (knees ok), 10 lunges/leg, 20 jumping jacks
  * medium: 3r — 15, 10, 12/leg, 30
  * hard: 4r — 20, 15, 15/leg, 40
  * epic: 5r — 25, 20, 18/leg, 50

---

## Templates (pick one; if \`category\` provided, restrict to it)

1. **Run Quest (fitness)**
   Title: "Run **{distance}** today"
   Short: "Warm up, run the set distance, then cool down."
   Description: Mix of steps + coaching note. Example:
   
   Warm up with a 5-min brisk walk
   
   Run {distance} at a steady pace
   
   End with 5-min stretching
   
   Tip: If running feels tough, swap for a brisk walk of the same duration.

2. **Power-Walk / Local Explorer (fitness)**
   Title: "Power-walk **{minutes}** and spot 3 new things"
   Short: "Take a brisk walk and notice your surroundings."
   Description:
   
   Walk briskly for {minutes}
   
   Keep posture upright, arms moving
   
   Pay attention to at least 3 things you've never noticed before
   
   This quest doubles as light cardio and mindfulness.

3. **Bodyweight Circuit (fitness)**
   Title: "Bodyweight circuit — **{rounds/reps}**"
   Short: "A quick bodyweight workout at home."
   Description:
   
   Do squats, push-ups, lunges, and jumping jacks as listed
   
   Rest 60–90 seconds between rounds
   
   Keep form controlled; knee push-ups allowed
   
   End with light stretching for recovery.

4. **Focused Study Sprint (learning)**
   Title: "Learn **one topic** in **{minutes}**"
   Short: "Dive into a topic with focused study."
   Description:
   
   Pick a free article or video on a beginner topic (memory palaces, note-taking, SQL basics)
   
   Study for {minutes} with full focus
   
   Write down key points in bullet form
   
   Summarize in 5 sentences
   
   This helps retention and builds a study habit.

5. **Skill Micro-Lesson (learning)**
   Title: "Master basics of **{micro-skill}** in **{minutes}**"
   Short: "Learn and capture fundamentals quickly."
   Description:
   
   Choose a beginner-friendly guide on the skill
   
   Spend study time reading/watching
   
   Create flashcards: easy=5, medium=10, hard=20, epic=30
   
   Review them once before finishing
   
   By writing cards yourself, you test recall immediately.

---

## Output (return **exactly** this shape)

\`\`\`json
{
  "title": "<<=60 chars>",
  "shortDescription": "<<=120 chars>",
  "category": "fitness" | "learning",
  "difficulty": "easy" | "medium" | "hard" | "epic",
  "duration_min": <integer>,
  "description": "<mix of 3–5 concrete steps and 1 coaching note, plain text>",
  "safety_notes": "<short (fitness only); empty string for learning>",
  "proof": ["<option 1>", "<option 2>"],
  "xp": <50|100|150|250>
}
\`\`\`

---

## Description Rules

* Must never be empty.
* Always provide clear steps (bullet points or numbers).
* Add 1 short coaching/motivational note at the end (paragraph style).
* Keep language short, actionable, and universal.

---

## Selection Logic

* **Quick:** randomly pick a template; alternate category vs previous result.
* **Custom:** honor the chosen category; then pick a template within it.
* Apply **difficulty scaling** to fill minutes/distances/reps and XP.
* Keep language **short, positive, and actionable**.
`;
  }

  private getUserPrompt(input: QuestGenerationInput): string {
    let prompt = `Generate a quest. Mode: ${input.mode}, Difficulty: ${input.difficulty}.`;
    if (input.category) {
      prompt += ` Category: ${input.category}.`;
    } else if (input.mode === 'quick' && this.lastGeneratedCategory) {
      // Alternate category for quick mode if not specified
      const nextCategory = this.lastGeneratedCategory === 'fitness' ? 'learning' : 'fitness';
      prompt += ` Try to alternate category, next should be: ${nextCategory}.`;
    }
    return prompt;
  }

  private async processAIOutput(aiOutput: AIQuestOutput): Promise<GeneratedQuest> {
    const normalizedCategoryName =
      aiOutput.category.charAt(0).toUpperCase() + aiOutput.category.slice(1).toLowerCase();

    const category = await prisma.questCategory.findFirst({
      where: { name: normalizedCategoryName },
    });

    if (!category) {
      throw new Error(`Quest category '${aiOutput.category}' not found in database.`);
    }

    // Convert lowercase difficulty to uppercase for Prisma
    const prismaDifficulty: QuestDifficulty = aiOutput.difficulty.toUpperCase() as QuestDifficulty;

    // Use the description directly from AI (it already contains steps + coaching)
    const description = aiOutput.description;
    const instructions = aiOutput.safety_notes ? `Safety Notes: ${aiOutput.safety_notes}` : '';

    // Determine submission types based on proof
    const submissionTypes: ('PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST')[] = [];
    if (aiOutput.proof.some(p => p.toLowerCase().includes('photo') || p.toLowerCase().includes('clip'))) {
      submissionTypes.push('PHOTO');
    }
    if (aiOutput.proof.some(p => p.toLowerCase().includes('video') || p.toLowerCase().includes('clip'))) {
      submissionTypes.push('VIDEO');
    }
    if (aiOutput.proof.some(p => p.toLowerCase().includes('text') || p.toLowerCase().includes('summary') || p.toLowerCase().includes('list'))) {
      submissionTypes.push('TEXT');
    }
    // Default to TEXT if no specific type is inferred
    if (submissionTypes.length === 0) {
      submissionTypes.push('TEXT');
    }

    // Determine location requirements
    const locationRequired = aiOutput.category === 'fitness' && (aiOutput.title.toLowerCase().includes('run') || aiOutput.title.toLowerCase().includes('walk'));
    const locationType = locationRequired ? 'outdoor' : undefined; // Assuming fitness quests are outdoor
    
    return {
      title: aiOutput.title,
      description: description, // This is the full description from AI with steps + coaching
      shortDescription: aiOutput.shortDescription,
      instructions: instructions,
      categoryId: category.id,
      difficulty: prismaDifficulty,
      tags: [aiOutput.category, aiOutput.difficulty],
      requirements: aiOutput.proof,
      estimatedTime: aiOutput.duration_min,
      submissionTypes: submissionTypes,
      locationRequired: locationRequired,
      locationType: locationType as 'indoor' | 'outdoor' | 'specific' | undefined,
      allowSharing: true,
      complexity: 1, // Default complexity, AI doesn't provide this directly
    };
  }

  async generateQuest(input: QuestGenerationInput): Promise<GeneratedQuest> {
    try {
      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(input);

      // Try Gemini first, fallback to mock if it fails
      let aiOutput: AIQuestOutput;
      try {
        const aiResponse = await geminiService.generateQuest({
          systemPrompt,
          userPrompt,
        });
        aiOutput = JSON.parse(aiResponse.content);
      } catch (geminiError) {
        console.warn('Gemini API failed, using fallback mock quest generation:', geminiError);
        aiOutput = this.generateMockQuest(input);
      }

      // Update last generated category for alternation logic
      this.lastGeneratedCategory = aiOutput.category;

      return this.processAIOutput(aiOutput);
    } catch (error) {
      console.error('Error generating quest:', error);
      throw new Error('Failed to generate quest');
    }
  }

  private generateMockQuest(input: QuestGenerationInput): AIQuestOutput {
    // Determine category
    let category: 'fitness' | 'learning';
    if (input.category) {
      category = input.category;
    } else {
      // Alternate categories for quick mode
      category = this.lastGeneratedCategory === 'fitness' ? 'learning' : 'fitness';
    }

    // Mock quest templates
    const fitnessQuests = [
      {
        title: "Power-walk 25 minutes and spot 3 new things",
        shortDescription: "Take a brisk walk and notice your surroundings.",
        description: "Walk briskly for 25 minutes\n\nKeep posture upright, arms moving\n\nPay attention to at least 3 things you've never noticed before\n\nThis quest doubles as light cardio and mindfulness.",
        safety_notes: "Stay hydrated and wear comfortable shoes",
        proof: ["Photo of your walking route", "Description of 3 new things you noticed"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'fitness')
      },
      {
        title: "Bodyweight circuit — 3 rounds",
        shortDescription: "A quick bodyweight workout at home.",
        description: "Do squats, push-ups, lunges, and jumping jacks as listed\n\nRest 60–90 seconds between rounds\n\nKeep form controlled; knee push-ups allowed\n\nEnd with light stretching for recovery.",
        safety_notes: "Warm up before starting, cool down after",
        proof: ["Photo after completing workout", "Text description of how you felt"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'fitness')
      },
      {
        title: `Run ${this.getDistanceForDifficulty(input.difficulty)} today`,
        shortDescription: "Warm up, run the set distance, then cool down.",
        description: "Warm up with a 5-min brisk walk\n\nRun at a steady pace\n\nEnd with 5-min stretching\n\nTip: If running feels tough, swap for a brisk walk of the same duration.",
        safety_notes: "Stay hydrated and listen to your body",
        proof: ["Photo of your running route", "Selfie after completing the run"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'fitness')
      }
    ];

    const learningQuests = [
      {
        title: `Learn one topic in ${this.getDurationForDifficulty(input.difficulty, 'learning')} minutes`,
        shortDescription: "Dive into a topic with focused study.",
        description: "Pick a free article or video on a beginner topic\n\nStudy with full focus\n\nWrite down key points in bullet form\n\nSummarize in 5 sentences\n\nThis helps retention and builds a study habit.",
        safety_notes: "",
        proof: ["Text summary of what you learned", "Photo of your notes"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'learning')
      },
      {
        title: "Master basics of a micro-skill",
        shortDescription: "Learn and capture fundamentals quickly.",
        description: "Choose a beginner-friendly guide on a new skill\n\nSpend time reading/watching\n\nCreate flashcards for key concepts\n\nReview them once before finishing\n\nBy writing cards yourself, you test recall immediately.",
        safety_notes: "",
        proof: ["Photo of your flashcards", "Text description of the skill you learned"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'learning')
      },
      {
        title: "Practice a new language for 20 minutes",
        shortDescription: "Build language skills with focused practice.",
        description: "Choose a language learning app or website\n\nPractice vocabulary and basic phrases\n\nTry to have a simple conversation with yourself\n\nWrite down 5 new words you learned\n\nConsistent practice builds fluency over time.",
        safety_notes: "",
        proof: ["Text list of new words learned", "Voice recording saying hello in the language"],
        xp: this.getXPForDifficulty(input.difficulty),
        duration_min: this.getDurationForDifficulty(input.difficulty, 'learning')
      }
    ];

    const quests = category === 'fitness' ? fitnessQuests : learningQuests;
    const selectedQuest = quests[Math.floor(Math.random() * quests.length)];

    if (!selectedQuest) {
      // Fallback quest if selection fails
      return {
        title: 'Adventure Quest',
        shortDescription: 'Complete this exciting challenge',
        description: 'A fun challenge to complete',
        safety_notes: 'Please be safe while completing this quest',
        proof: ['Photo of completion'],
        xp: 50,
        duration_min: 30,
        category,
        difficulty: input.difficulty
      };
    }

    return {
      title: selectedQuest.title || 'Quest Challenge',
      shortDescription: selectedQuest.shortDescription || 'Complete this exciting challenge',
      description: selectedQuest.description || 'A fun challenge to complete',
      safety_notes: selectedQuest.safety_notes || 'Please be safe while completing this quest',
      proof: selectedQuest.proof || ['Photo of completion'],
      xp: selectedQuest.xp || 50,
      duration_min: selectedQuest.duration_min || 30,
      category,
      difficulty: input.difficulty
    };
  }

  private getXPForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 50;
      case 'medium': return 100;
      case 'hard': return 150;
      case 'epic': return 250;
      default: return 50;
    }
  }

  private getDurationForDifficulty(difficulty: string, category: 'fitness' | 'learning'): number {
    if (category === 'learning') {
      switch (difficulty) {
        case 'easy': return 20;
        case 'medium': return 40;
        case 'hard': return 75;
        case 'epic': return 120;
        default: return 20;
      }
    } else {
      // Fitness duration
      switch (difficulty) {
        case 'easy': return 20;
        case 'medium': return 35;
        case 'hard': return 60;
        case 'epic': return 90;
        default: return 20;
      }
    }
  }

  private getDistanceForDifficulty(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '2 km (1.2 mi)';
      case 'medium': return '5 km (3.1 mi)';
      case 'hard': return '10 km (6.2 mi)';
      case 'epic': return '15 km (9.3 mi)';
      default: return '2 km (1.2 mi)';
    }
  }

  async generateQuestBatch(input: QuestGenerationInput, count: number): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    for (let i = 0; i < count; i++) {
      try {
        // For batch, we might want to vary category/difficulty if not specified
        const currentInput = { ...input };
        if (input.mode === 'quick' && !input.category) {
          currentInput.category = this.lastGeneratedCategory === 'fitness' ? 'learning' : 'fitness';
        }
        const quest = await this.generateQuest(currentInput);
        quests.push(quest);
      } catch (error) {
        console.warn(`Failed to generate quest in batch (attempt ${i + 1}):`, error);
      }
    }
    return quests;
  }
}

export const aiQuestGenerator = new AIQuestGenerator();
