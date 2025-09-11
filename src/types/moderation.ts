// Content Moderation Types for SideQuest Frontend

export interface ModerationResult {
  id: string;
  contentId: string;
  contentType: ContentType;
  status: ModerationStatus;
  severity: ModerationSeverity;
  confidence: number;
  flags: ModerationFlag[];
  details: ModerationDetails;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentType = 'quest' | 'submission' | 'comment' | 'media' | 'user_profile';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'escalated';
export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationFlag {
  type: ModerationFlagType;
  severity: ModerationSeverity;
  confidence: number;
  description: string;
  details?: any;
  position?: {
    start: number;
    end: number;
  };
}

export type ModerationFlagType = 
  | 'profanity'
  | 'hate_speech'
  | 'harassment'
  | 'spam'
  | 'inappropriate_content'
  | 'violence'
  | 'nudity'
  | 'adult_content'
  | 'illegal_content'
  | 'copyright_violation'
  | 'personal_information'
  | 'phishing'
  | 'scam'
  | 'misinformation'
  | 'fake_news'
  | 'trolling'
  | 'cyberbullying'
  | 'self_harm'
  | 'suicide_ideation'
  | 'drug_related'
  | 'weapon_related'
  | 'terrorism'
  | 'extremism'
  | 'discrimination'
  | 'racism'
  | 'sexism'
  | 'homophobia'
  | 'transphobia'
  | 'ageism'
  | 'religious_intolerance'
  | 'political_extremism'
  | 'conspiracy_theories'
  | 'medical_misinformation'
  | 'safety_violation'
  | 'privacy_violation'
  | 'terms_violation'
  | 'community_guidelines'
  | 'other';

export interface ModerationDetails {
  textAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    toxicity: number;
    profanity: number;
    hate: number;
    threat: number;
    insult: number;
    identityAttack: number;
    sexualExplicit: number;
  };
  imageAnalysis?: {
    safeSearch: {
      adult: number;
      violence: number;
      racy: number;
      spoof: number;
      medical: number;
    };
    labels: Array<{
      name: string;
      confidence: number;
      category: string;
    }>;
    faces: Array<{
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  };
  videoAnalysis?: {
    safeSearch: {
      adult: number;
      violence: number;
      racy: number;
      spoof: number;
      medical: number;
    };
    labels: Array<{
      name: string;
      confidence: number;
      category: string;
      timestamp: number;
    }>;
    audioAnalysis?: {
      language: string;
      sentiment: string;
      toxicity: number;
    };
  };
  metadata?: {
    language: string;
    detectedLanguage: string;
    wordCount: number;
    characterCount: number;
    readingLevel: number;
    complexity: number;
  };
}

export interface ModerationQueue {
  id: string;
  contentId: string;
  contentType: ContentType;
  priority: ModerationPriority;
  status: ModerationStatus;
  submittedAt: string;
  assignedTo?: string;
  estimatedTime?: number;
  flags: ModerationFlag[];
  content: {
    title?: string;
    description?: string;
    text?: string;
    mediaUrl?: string;
    author: string;
    authorId: string;
  };
}

export type ModerationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  escalated: number;
  byType: Record<ContentType, number>;
  bySeverity: Record<ModerationSeverity, number>;
  byFlag: Record<ModerationFlagType, number>;
  averageProcessingTime: number;
  accuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface ModerationSettings {
  autoModeration: boolean;
  aiModeration: boolean;
  humanReview: boolean;
  escalationThreshold: number;
  autoApproveThreshold: number;
  autoRejectThreshold: number;
  flagTypes: {
    [key in ModerationFlagType]: {
      enabled: boolean;
      severity: ModerationSeverity;
      autoAction: 'none' | 'flag' | 'reject' | 'escalate';
      threshold: number;
    };
  };
  contentTypes: {
    [key in ContentType]: {
      enabled: boolean;
      autoModeration: boolean;
      humanReview: boolean;
      escalationThreshold: number;
    };
  };
  notifications: {
    onFlag: boolean;
    onEscalation: boolean;
    onApproval: boolean;
    onRejection: boolean;
  };
}

export interface ModerationAction {
  id: string;
  moderationId: string;
  action: ModerationActionType;
  reason: string;
  details?: string;
  performedBy: string;
  performedAt: string;
  metadata?: any;
}

export type ModerationActionType = 
  | 'approve'
  | 'reject'
  | 'flag'
  | 'escalate'
  | 'request_review'
  | 'add_comment'
  | 'add_flag'
  | 'remove_flag'
  | 'change_severity'
  | 'assign_reviewer'
  | 'unassign_reviewer'
  | 'archive'
  | 'restore';

export interface ModerationReport {
  id: string;
  contentId: string;
  contentType: ContentType;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: ModerationPriority;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

// Constants
export const MODERATION_FLAG_ICONS: Record<ModerationFlagType, string> = {
  profanity: '🤬',
  hate_speech: '💀',
  harassment: '⚠️',
  spam: '📧',
  inappropriate_content: '🚫',
  violence: '👊',
  nudity: '🔞',
  adult_content: '🔞',
  illegal_content: '⚖️',
  copyright_violation: '©️',
  personal_information: '👤',
  phishing: '🎣',
  scam: '💰',
  misinformation: '📰',
  fake_news: '📰',
  trolling: '😈',
  cyberbullying: '💔',
  self_harm: '💔',
  suicide_ideation: '💔',
  drug_related: '💊',
  weapon_related: '🔫',
  terrorism: '💥',
  extremism: '🔥',
  discrimination: '🚫',
  racism: '🚫',
  sexism: '🚫',
  homophobia: '🚫',
  transphobia: '🚫',
  ageism: '🚫',
  religious_intolerance: '🚫',
  political_extremism: '🏛️',
  conspiracy_theories: '🔮',
  medical_misinformation: '🏥',
  safety_violation: '⚠️',
  privacy_violation: '🔒',
  terms_violation: '📋',
  community_guidelines: '📜',
  other: '❓',
};

export const MODERATION_FLAG_COLORS: Record<ModerationFlagType, string> = {
  profanity: 'text-yellow-600',
  hate_speech: 'text-red-600',
  harassment: 'text-orange-600',
  spam: 'text-gray-600',
  inappropriate_content: 'text-red-600',
  violence: 'text-red-600',
  nudity: 'text-red-600',
  adult_content: 'text-red-600',
  illegal_content: 'text-red-600',
  copyright_violation: 'text-blue-600',
  personal_information: 'text-yellow-600',
  phishing: 'text-red-600',
  scam: 'text-red-600',
  misinformation: 'text-orange-600',
  fake_news: 'text-orange-600',
  trolling: 'text-purple-600',
  cyberbullying: 'text-red-600',
  self_harm: 'text-red-600',
  suicide_ideation: 'text-red-600',
  drug_related: 'text-orange-600',
  weapon_related: 'text-red-600',
  terrorism: 'text-red-600',
  extremism: 'text-red-600',
  discrimination: 'text-red-600',
  racism: 'text-red-600',
  sexism: 'text-red-600',
  homophobia: 'text-red-600',
  transphobia: 'text-red-600',
  ageism: 'text-red-600',
  religious_intolerance: 'text-red-600',
  political_extremism: 'text-orange-600',
  conspiracy_theories: 'text-purple-600',
  medical_misinformation: 'text-red-600',
  safety_violation: 'text-orange-600',
  privacy_violation: 'text-yellow-600',
  terms_violation: 'text-blue-600',
  community_guidelines: 'text-blue-600',
  other: 'text-gray-600',
};

export const MODERATION_SEVERITY_COLORS: Record<ModerationSeverity, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export const MODERATION_STATUS_COLORS: Record<ModerationStatus, string> = {
  pending: 'text-yellow-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  flagged: 'text-orange-600',
  escalated: 'text-purple-600',
};

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  quest: '🎯',
  submission: '📝',
  comment: '💬',
  media: '📷',
  user_profile: '👤',
};