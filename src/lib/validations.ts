import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must be no more than 20 characters long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (val) => !val.startsWith('_') && !val.endsWith('_'),
    'Username cannot start or end with an underscore'
  );

const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(50, 'Name must be no more than 50 characters long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens');

const bioSchema = z.string()
  .max(200, 'Bio must be no more than 200 characters long')
  .optional()
  .or(z.literal(''));

const locationSchema = z.string()
  .max(100, 'Location must be no more than 100 characters long')
  .optional()
  .or(z.literal(''));

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: nameSchema.optional().or(z.literal('')),
  lastName: nameSchema.optional().or(z.literal('')),
  agreeToTerms: z.boolean().refine(
    (val) => val === true,
    'You must agree to the terms and conditions'
  )
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
);

// Profile schemas
export const profileSchema = z.object({
  username: usernameSchema,
  firstName: nameSchema.optional().or(z.literal('')),
  lastName: nameSchema.optional().or(z.literal('')),
  bio: bioSchema,
  location: locationSchema
});

export const emailUpdateSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Current password is required to change email')
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password')
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'New passwords do not match',
    path: ['confirmNewPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword']
  }
);

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
  confirmText: z.string().refine(
    (val) => val === 'DELETE',
    'Please type "DELETE" to confirm account deletion'
  ),
  reason: z.string().optional()
});

// Quest schemas
export const questSubmissionSchema = z.object({
  type: z.enum(['PHOTO', 'VIDEO', 'TEXT', 'CHECKLIST'], {
    required_error: 'Submission type is required'
  }),
  caption: z.string()
    .min(1, 'Caption is required')
    .max(500, 'Caption must be no more than 500 characters long'),
  textContent: z.string()
    .max(2000, 'Text content must be no more than 2000 characters long')
    .optional(),
  privacy: z.enum(['public', 'friends', 'private'], {
    required_error: 'Privacy setting is required'
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional()
  }).optional()
});

// Contact/Support schemas
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be no more than 100 characters long'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters long')
    .max(1000, 'Message must be no more than 1000 characters long'),
  category: z.enum(['bug', 'feature', 'account', 'quest', 'other'], {
    required_error: 'Please select a category'
  }).optional()
});

// Search and filter schemas
export const questFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EPIC']).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100, 'Search query must be no more than 100 characters').optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a file' })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      'File size must be less than 10MB'
    ),
  category: z.enum(['avatar', 'quest-submission', 'quest-image'], {
    required_error: 'File category is required'
  })
});

export const avatarUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Please select an image file' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      'Image size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    )
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  questReminders: z.boolean(),
  friendActivity: z.boolean(),
  systemUpdates: z.boolean(),
  marketingEmails: z.boolean()
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']),
  showLocation: z.boolean(),
  showJoinDate: z.boolean(),
  showQuestHistory: z.boolean(),
  allowQuestSharing: z.boolean(),
  allowFriendRequests: z.boolean(),
  showOnlineStatus: z.boolean(),
  dataCollection: z.object({
    analytics: z.boolean(),
    performance: z.boolean(),
    personalization: z.boolean()
  }),
  notifications: z.object({
    questReminders: z.boolean(),
    friendActivity: z.boolean(),
    systemUpdates: z.boolean(),
    marketingEmails: z.boolean()
  })
});

// Onboarding schema
export const onboardingSchema = z.object({
  preferredCategories: z.array(z.string()).min(1, 'Please select at least one category'),
  defaultPrivacy: z.enum(['public', 'friends', 'private'])
});

// Export types for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
export type QuestSubmissionFormData = z.infer<typeof questSubmissionSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type QuestFilterFormData = z.infer<typeof questFilterSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type AvatarUploadFormData = z.infer<typeof avatarUploadSchema>;
export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;
export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Validation helpers
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validateUsername = (username: string): boolean => {
  try {
    usernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
};

// Password strength calculator
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  // Bonus points for length
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const isValid = validatePassword(password);

  return {
    score: Math.min(score, 5),
    feedback,
    isValid
  };
};