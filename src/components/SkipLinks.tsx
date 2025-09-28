import React from 'react';
import { Button } from '@/components/ui/button';
import { useSkipLinks } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface SkipLinksProps {
  className?: string;
}

export function SkipLinks({ className }: SkipLinksProps) {
  const { skipLinks, skipTo } = useSkipLinks();

  if (skipLinks.length === 0) return null;

  return (
    <div className={cn('fixed top-0 left-0 z-[100] p-2', className)}>
      <div className="flex flex-col gap-1">
        {skipLinks.map((link) => (
          <Button
            key={link.id}
            variant="outline"
            size="sm"
            onClick={() => skipTo(link.id)}
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground z-[101]"
          >
            Skip to {link.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Default skip links for common page structure
export function DefaultSkipLinks() {
  const { addSkipLink } = useSkipLinks();

  // Add default skip links on mount
  React.useEffect(() => {
    addSkipLink('main-content', 'main content');
    addSkipLink('main-navigation', 'navigation');
    addSkipLink('search', 'search');
  }, [addSkipLink]);

  return <SkipLinks />;
}