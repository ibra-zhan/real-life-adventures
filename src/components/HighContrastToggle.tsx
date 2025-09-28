import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useHighContrast, useScreenReader } from '@/hooks/useAccessibility';
import { Monitor, Contrast } from 'lucide-react';

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function HighContrastToggle({ className, showLabel = true }: HighContrastToggleProps) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const systemHighContrast = useHighContrast();
  const { announce } = useScreenReader();

  useEffect(() => {
    // Check if user has manually set high contrast mode
    const savedMode = localStorage.getItem('high-contrast-mode');
    if (savedMode !== null) {
      setIsHighContrast(savedMode === 'true');
    } else {
      setIsHighContrast(systemHighContrast);
    }
  }, [systemHighContrast]);

  useEffect(() => {
    // Apply high contrast class to document
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    const newMode = !isHighContrast;
    setIsHighContrast(newMode);
    localStorage.setItem('high-contrast-mode', newMode.toString());

    announce(
      newMode ? 'High contrast mode enabled' : 'High contrast mode disabled',
      'assertive'
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleHighContrast}
      className={className}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={isHighContrast}
    >
      <Contrast className="w-4 h-4" />
      {showLabel && (
        <span className="ml-2">
          {isHighContrast ? 'Disable' : 'Enable'} High Contrast
        </span>
      )}
    </Button>
  );
}

// CSS for high contrast mode (to be added to global styles)
export const highContrastStyles = `
.high-contrast {
  --background: #000000;
  --foreground: #ffffff;
  --card: #000000;
  --card-foreground: #ffffff;
  --popover: #000000;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #333333;
  --secondary-foreground: #ffffff;
  --muted: #333333;
  --muted-foreground: #cccccc;
  --accent: #444444;
  --accent-foreground: #ffffff;
  --destructive: #ff0000;
  --destructive-foreground: #ffffff;
  --border: #ffffff;
  --input: #000000;
  --ring: #ffffff;
}

.high-contrast * {
  border-color: var(--border) !important;
}

.high-contrast img {
  filter: contrast(1.5) brightness(1.2);
}

.high-contrast .text-muted-foreground {
  color: var(--muted-foreground) !important;
}
`;