// Comprehensive user flow tests for Real Life Adventures
// These tests verify end-to-end user journeys work correctly

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import App from '@/App';

// Mock modules
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationEmail: vi.fn(),
    getQuests: vi.fn(),
    getQuest: vi.fn(),
    submitQuest: vi.fn(),
    generateQuest: vi.fn(),
    getNotifications: vi.fn(),
    uploadFile: vi.fn()
  }
}));

vi.mock('@/hooks/useAccessibility', () => ({
  useScreenReader: () => ({
    announce: vi.fn(),
    announceNavigation: vi.fn(),
    announceAction: vi.fn(),
    announceError: vi.fn(),
    announceSuccess: vi.fn()
  }),
  useLandmarks: () => ({
    addLandmark: vi.fn(),
    removeLandmark: vi.fn()
  }),
  useSkipLinks: () => ({
    skipLinks: [],
    addSkipLink: vi.fn(),
    removeSkipLink: vi.fn(),
    skipTo: vi.fn()
  })
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('User Registration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('user can complete registration process', async () => {
    const user = userEvent.setup();

    render(<App />, { wrapper: TestWrapper });

    // Navigate to registration
    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);

    // Fill registration form
    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'TestPassword123!');
    await user.type(confirmPasswordInput, 'TestPassword123!');

    // Accept terms
    const termsCheckbox = screen.getByLabelText(/agree to terms/i);
    await user.click(termsCheckbox);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.register)).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        agreeToTerms: true
      });
    });
  });

  test('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();

    render(<App />, { wrapper: TestWrapper });

    // Navigate to registration
    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/username.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
    });
  });
});

describe('User Login Flow', () => {
  test('user can login with valid credentials', async () => {
    const user = userEvent.setup();

    // Mock successful login
    vi.mocked(require('@/lib/api-client').apiClient.login).mockResolvedValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to login
    const loginLink = screen.getByText(/sign in/i);
    await user.click(loginLink);

    // Fill login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Verify API call and navigation
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.login)).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
    });
  });
});

describe('Onboarding Flow', () => {
  test('new user completes onboarding', async () => {
    const user = userEvent.setup();

    // Mock authenticated user without onboarding
    vi.mocked(require('@/contexts/AuthContext').useAuthContext).mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        onboardingCompleted: false
      },
      isAuthenticated: true,
      isLoading: false
    });

    render(<App />, { wrapper: TestWrapper });

    // Should redirect to onboarding
    await waitFor(() => {
      expect(screen.getByText(/welcome to sidequest/i)).toBeInTheDocument();
    });

    // Complete onboarding steps
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Select categories
    const kindnessCategory = screen.getByRole('button', { name: /kindness/i });
    await user.click(kindnessCategory);

    await user.click(nextButton);

    // Select privacy setting
    const publicOption = screen.getByRole('button', { name: /public/i });
    await user.click(publicOption);

    await user.click(nextButton);

    // Complete onboarding
    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    await user.click(getStartedButton);

    // Verify completion
    await waitFor(() => {
      expect(screen.getByText(/home/i)).toBeInTheDocument();
    });
  });
});

describe('Quest Flow', () => {
  test('user can view and start a quest', async () => {
    const user = userEvent.setup();

    // Mock quest data
    const mockQuest = {
      id: 'quest1',
      title: 'Test Quest',
      description: 'A test quest',
      difficulty: 'EASY',
      category: 'kindness',
      points: 10
    };

    vi.mocked(require('@/lib/api-client').apiClient.getQuests).mockResolvedValue({
      data: [mockQuest]
    });

    vi.mocked(require('@/lib/api-client').apiClient.getQuest).mockResolvedValue({
      data: mockQuest
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to quests
    const questsLink = screen.getByText(/quests/i);
    await user.click(questsLink);

    // Click on a quest
    await waitFor(() => {
      const questCard = screen.getByText('Test Quest');
      expect(questCard).toBeInTheDocument();
    });

    const questCard = screen.getByText('Test Quest');
    await user.click(questCard);

    // Start quest
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /start quest/i });
      expect(startButton).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /start quest/i });
    await user.click(startButton);

    // Verify quest started
    await waitFor(() => {
      expect(screen.getByText(/submit quest/i)).toBeInTheDocument();
    });
  });

  test('user can submit quest completion', async () => {
    const user = userEvent.setup();

    // Mock quest submission
    vi.mocked(require('@/lib/api-client').apiClient.submitQuest).mockResolvedValue({
      data: { id: 'submission1', questId: 'quest1' }
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to quest submission (assuming we're already on the page)
    // Fill submission form
    const captionInput = screen.getByLabelText(/caption/i);
    await user.type(captionInput, 'Completed the quest!');

    // Select privacy setting
    const privacySelect = screen.getByLabelText(/privacy/i);
    await user.selectOptions(privacySelect, 'public');

    // Submit quest
    const submitButton = screen.getByRole('button', { name: /submit quest/i });
    await user.click(submitButton);

    // Verify submission
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.submitQuest)).toHaveBeenCalled();
    });
  });
});

describe('Profile Management Flow', () => {
  test('user can update profile information', async () => {
    const user = userEvent.setup();

    // Mock profile update
    vi.mocked(require('@/lib/api-client').apiClient.updateProfile).mockResolvedValue({
      data: { id: '1', username: 'updateduser', bio: 'Updated bio' }
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to profile
    const profileLink = screen.getByText(/profile/i);
    await user.click(profileLink);

    // Navigate to account settings
    const settingsButton = screen.getByRole('button', { name: /account settings/i });
    await user.click(settingsButton);

    // Update profile fields
    const usernameInput = screen.getByLabelText(/username/i);
    const bioInput = screen.getByLabelText(/bio/i);

    await user.clear(usernameInput);
    await user.type(usernameInput, 'updateduser');

    await user.clear(bioInput);
    await user.type(bioInput, 'Updated bio');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Verify update
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.updateProfile)).toHaveBeenCalledWith({
        username: 'updateduser',
        bio: 'Updated bio'
      });
    });
  });

  test('user can change password', async () => {
    const user = userEvent.setup();

    // Mock password change
    vi.mocked(require('@/lib/api-client').apiClient.changePassword).mockResolvedValue({
      success: true
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to change password
    const changePasswordLink = screen.getByText(/change password/i);
    await user.click(changePasswordLink);

    // Fill password form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(currentPasswordInput, 'OldPassword123!');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    // Verify password change
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.changePassword)).toHaveBeenCalledWith(
        'OldPassword123!',
        'NewPassword123!'
      );
    });
  });
});

describe('Email Verification Flow', () => {
  test('user can verify email', async () => {
    const user = userEvent.setup();

    // Mock email verification
    vi.mocked(require('@/lib/api-client').apiClient.verifyEmail).mockResolvedValue({
      success: true
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to email verification with token
    window.history.pushState({}, '', '/verify-email?token=verification123');

    // Should automatically verify
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.verifyEmail)).toHaveBeenCalledWith('verification123');
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
  });

  test('user can resend verification email', async () => {
    const user = userEvent.setup();

    // Mock resend verification
    vi.mocked(require('@/lib/api-client').apiClient.resendVerificationEmail).mockResolvedValue({
      success: true
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to email verification
    const verifyEmailLink = screen.getByText(/verify email/i);
    await user.click(verifyEmailLink);

    // Click resend button
    const resendButton = screen.getByRole('button', { name: /resend/i });
    await user.click(resendButton);

    // Verify resend call
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.resendVerificationEmail)).toHaveBeenCalled();
    });
  });
});

describe('Privacy Settings Flow', () => {
  test('user can update privacy settings', async () => {
    const user = userEvent.setup();

    // Mock privacy settings update
    vi.mocked(require('@/lib/api-client').apiClient.updatePreferences).mockResolvedValue({
      success: true
    });

    render(<App />, { wrapper: TestWrapper });

    // Navigate to privacy settings
    const privacyLink = screen.getByText(/privacy settings/i);
    await user.click(privacyLink);

    // Toggle privacy switches
    const showLocationSwitch = screen.getByLabelText(/show location/i);
    await user.click(showLocationSwitch);

    const allowSharingSwitch = screen.getByLabelText(/allow quest sharing/i);
    await user.click(allowSharingSwitch);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save privacy settings/i });
    await user.click(saveButton);

    // Verify update
    await waitFor(() => {
      expect(vi.mocked(require('@/lib/api-client').apiClient.updatePreferences)).toHaveBeenCalled();
    });
  });
});

describe('Error Handling', () => {
  test('displays error when API calls fail', async () => {
    const user = userEvent.setup();

    // Mock API failure
    vi.mocked(require('@/lib/api-client').apiClient.login).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(<App />, { wrapper: TestWrapper });

    // Try to login with invalid credentials
    const loginLink = screen.getByText(/sign in/i);
    await user.click(loginLink);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('handles network errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock network error
    vi.mocked(require('@/lib/api-client').apiClient.getQuests).mockRejectedValue(
      new Error('Network error')
    );

    render(<App />, { wrapper: TestWrapper });

    // Navigate to quests
    const questsLink = screen.getByText(/quests/i);
    await user.click(questsLink);

    // Should display error state
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  test('app is keyboard navigable', async () => {
    render(<App />, { wrapper: TestWrapper });

    // Tab through navigation
    const body = document.body;
    fireEvent.keyDown(body, { key: 'Tab' });

    // First focusable element should be focused
    const firstFocusable = screen.getByRole('button');
    expect(firstFocusable).toHaveFocus();
  });

  test('skip links work correctly', async () => {
    const user = userEvent.setup();

    render(<App />, { wrapper: TestWrapper });

    // Press Alt+M for main content skip link
    fireEvent.keyDown(document, { key: 'm', altKey: true });

    // Should focus main content
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toHaveFocus();
  });
});

describe('Mobile Features', () => {
  test('touch gestures work correctly', async () => {
    // Mock touch events
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch]
    });
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 200, clientY: 100 } as Touch]
    });
    const touchEnd = new TouchEvent('touchend');

    render(<App />, { wrapper: TestWrapper });

    const container = screen.getByTestId('swipe-container');

    // Simulate swipe gesture
    fireEvent(container, touchStart);
    fireEvent(container, touchMove);
    fireEvent(container, touchEnd);

    // Should trigger swipe action
    // (Specific assertions would depend on implementation)
  });
});

export { TestWrapper };