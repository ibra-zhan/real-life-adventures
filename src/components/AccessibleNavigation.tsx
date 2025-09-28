import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  useKeyboardNavigation,
  useScreenReader,
  useLandmarks,
  useAriaAttributes
} from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';
import {
  Home,
  Target,
  User,
  Bell,
  Settings,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children?: NavigationItem[];
}

interface AccessibleNavigationProps {
  items: NavigationItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'main' | 'secondary' | 'mobile';
  ariaLabel?: string;
}

export function AccessibleNavigation({
  items,
  className,
  orientation = 'horizontal',
  variant = 'main',
  ariaLabel = 'Main navigation'
}: AccessibleNavigationProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const navRef = useRef<HTMLElement>(null);

  const { currentIndex, setCurrentIndex, handleKeyDown } = useKeyboardNavigation();
  const { announce } = useScreenReader();
  const { addLandmark, removeLandmark } = useLandmarks();
  const { generateId, createAriaLabel } = useAriaAttributes();

  const navId = generateId('navigation');
  const menuButtonId = generateId('menu-button');

  // Register navigation landmark
  useEffect(() => {
    addLandmark(navId, 'navigation', ariaLabel);
    return () => removeLandmark(navId);
  }, [addLandmark, removeLandmark, navId, ariaLabel]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!navRef.current) return;

    const handleNav = (e: KeyboardEvent) => {
      handleKeyDown(e, items, (index) => {
        const item = items[index];
        if (item.children) {
          toggleExpanded(item.id);
        } else {
          // Navigate to the item
          window.location.href = item.href;
        }
      }, () => {
        if (variant === 'mobile') {
          setIsOpen(false);
        }
      });
    };

    navRef.current.addEventListener('keydown', handleNav);
    return () => navRef.current?.removeEventListener('keydown', handleNav);
  }, [handleKeyDown, items, variant]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        announce(`Collapsed ${items.find(item => item.id === itemId)?.label} menu`);
      } else {
        newSet.add(itemId);
        announce(`Expanded ${items.find(item => item.id === itemId)?.label} menu`);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const renderNavigationItem = (item: NavigationItem, index: number, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isFocused = currentIndex === index;

    const itemId = generateId(`nav-item-${item.id}`);
    const submenuId = hasChildren ? generateId(`submenu-${item.id}`) : undefined;

    const ItemIcon = item.icon;

    if (hasChildren) {
      return (
        <li key={item.id} role="none">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-left',
              isFocused && 'bg-accent',
              active && 'bg-primary/10 text-primary'
            )}
            onClick={() => toggleExpanded(item.id)}
            aria-expanded={isExpanded}
            aria-controls={submenuId}
            aria-describedby={item.description ? `${itemId}-desc` : undefined}
            onFocus={() => setCurrentIndex(index)}
          >
            <ItemIcon className="w-4 h-4 mr-2" />
            <span className="flex-1">{item.label}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>

          {item.description && (
            <div id={`${itemId}-desc`} className="sr-only">
              {item.description}
            </div>
          )}

          {hasChildren && (
            <ul
              id={submenuId}
              role="menu"
              className={cn(
                'ml-6 mt-1 space-y-1',
                !isExpanded && 'hidden'
              )}
              aria-hidden={!isExpanded}
            >
              {item.children!.map((child, childIndex) =>
                renderNavigationItem(child, items.length + childIndex, level + 1)
              )}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.id} role="none">
        <Link
          to={item.href}
          className={cn(
            'flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            isFocused && 'bg-accent',
            active && 'bg-primary/10 text-primary font-semibold'
          )}
          aria-current={active ? 'page' : undefined}
          aria-describedby={item.description ? `${itemId}-desc` : undefined}
          onFocus={() => setCurrentIndex(index)}
          onClick={() => {
            announce(`Navigating to ${item.label}`);
            if (variant === 'mobile') {
              setIsOpen(false);
            }
          }}
        >
          <ItemIcon className="w-4 h-4 mr-2" />
          <span>{item.label}</span>
          {active && <span className="sr-only">(current page)</span>}
        </Link>

        {item.description && (
          <div id={`${itemId}-desc`} className="sr-only">
            {item.description}
          </div>
        )}
      </li>
    );
  };

  if (variant === 'mobile') {
    return (
      <>
        <Button
          id={menuButtonId}
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(!isOpen);
            announce(isOpen ? 'Menu closed' : 'Menu opened');
          }}
          aria-expanded={isOpen}
          aria-controls={navId}
          aria-label="Toggle navigation menu"
          className="md:hidden"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {isOpen && (
          <nav
            ref={navRef}
            id={navId}
            role="navigation"
            aria-label={ariaLabel}
            aria-labelledby={menuButtonId}
            className={cn(
              'absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg',
              'md:hidden',
              className
            )}
          >
            <ul role="menubar" className="p-4 space-y-2">
              {items.map((item, index) => renderNavigationItem(item, index))}
            </ul>
          </nav>
        )}
      </>
    );
  }

  return (
    <nav
      ref={navRef}
      id={navId}
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        orientation === 'horizontal' ? 'flex items-center space-x-2' : 'space-y-2',
        className
      )}
    >
      <ul
        role="menubar"
        className={cn(
          orientation === 'horizontal' ? 'flex items-center space-x-1' : 'space-y-1'
        )}
        aria-orientation={orientation}
      >
        {items.map((item, index) => renderNavigationItem(item, index))}
      </ul>
    </nav>
  );
}

// Predefined navigation configurations
export const MainNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    icon: Home,
    description: 'Go to the main dashboard'
  },
  {
    id: 'quests',
    label: 'Quests',
    href: '/ai-quests',
    icon: Target,
    description: 'Browse and generate quests'
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: User,
    description: 'View and edit your profile'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'View your notifications and alerts'
  }
];

export const SettingsNavigationItems: NavigationItem[] = [
  {
    id: 'account',
    label: 'Account Settings',
    href: '/account-settings',
    icon: User,
    description: 'Manage your account information'
  },
  {
    id: 'privacy',
    label: 'Privacy Settings',
    href: '/privacy-settings',
    icon: Settings,
    description: 'Control your privacy preferences'
  }
];

// Main Navigation Component
export function MainNavigation({ className }: { className?: string }) {
  return (
    <AccessibleNavigation
      items={MainNavigationItems}
      className={className}
      ariaLabel="Main navigation"
    />
  );
}

// Mobile Navigation Component
export function MobileNavigation({ className }: { className?: string }) {
  return (
    <AccessibleNavigation
      items={MainNavigationItems}
      variant="mobile"
      className={className}
      ariaLabel="Main navigation"
    />
  );
}