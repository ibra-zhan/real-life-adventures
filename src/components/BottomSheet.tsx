import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useTouchGestures, useSafeAreaInsets } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { X, GripHorizontal } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHandle?: boolean;
  showCloseButton?: boolean;
  snapPoints?: number[]; // Percentages of screen height
  defaultSnap?: number; // Index of default snap point
  enableSwipeDown?: boolean;
  preventScrollWhenOpen?: boolean;
  className?: string;
  contentClassName?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  showHandle = true,
  showCloseButton = true,
  snapPoints = [0.5, 0.9], // 50% and 90% of screen height
  defaultSnap = 0,
  enableSwipeDown = true,
  preventScrollWhenOpen = true,
  className,
  contentClassName
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const safeAreaInsets = useSafeAreaInsets();

  const currentSnapPoint = snapPoints[currentSnapIndex];
  const sheetHeight = `${currentSnapPoint * 100}vh`;

  // Prevent body scroll when open
  useEffect(() => {
    if (preventScrollWhenOpen && open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, preventScrollWhenOpen]);

  // Handle touch events for dragging
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableSwipeDown) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [enableSwipeDown]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || startY.current === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    // Only allow dragging down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Threshold for closing (20% of screen height)
    const closeThreshold = window.innerHeight * 0.2;

    if (dragOffset > closeThreshold) {
      onOpenChange(false);
    } else if (dragOffset > 50) {
      // Snap to next lower snap point
      const nextSnapIndex = Math.max(0, currentSnapIndex - 1);
      if (nextSnapIndex !== currentSnapIndex) {
        setCurrentSnapIndex(nextSnapIndex);
      } else {
        onOpenChange(false);
      }
    }

    setDragOffset(0);
    startY.current = null;
  }, [isDragging, dragOffset, currentSnapIndex, onOpenChange]);

  // Add touch event listeners
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Handle snap point changes
  const snapTo = useCallback((snapIndex: number) => {
    if (snapIndex >= 0 && snapIndex < snapPoints.length) {
      setCurrentSnapIndex(snapIndex);
    }
  }, [snapPoints.length]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  const transform = isDragging
    ? `translateY(${dragOffset}px)`
    : 'translateY(0)';

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center',
        className
      )}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        style={{
          opacity: isDragging ? Math.max(0.1, 1 - dragOffset / (window.innerHeight * 0.5)) : 1
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full bg-background rounded-t-lg shadow-lg transition-transform duration-300 ease-out',
          isDragging ? 'transition-none' : ''
        )}
        style={{
          height: sheetHeight,
          transform,
          paddingBottom: safeAreaInsets.bottom
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        aria-describedby={description ? 'bottom-sheet-description' : undefined}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-2 pb-1">
            <GripHorizontal className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex-1">
              {title && (
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="bottom-sheet-description"
                  className="text-sm text-muted-foreground mt-1"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={close}
                className="ml-2 h-8 w-8 p-0"
                aria-label="Close bottom sheet"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain',
            contentClassName
          )}
        >
          {children}
        </div>

        {/* Snap points indicator */}
        {snapPoints.length > 1 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
            {snapPoints.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentSnapIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                onClick={() => snapTo(index)}
                aria-label={`Snap to ${snapPoints[index] * 100}% height`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// Specialized bottom sheets for common use cases
interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'secondary';
    disabled?: boolean;
  }>;
  cancelLabel?: string;
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  actions,
  cancelLabel = 'Cancel'
}: ActionSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      snapPoints={[0.3]}
      showHandle={false}
      contentClassName="p-4"
    >
      <div className="space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            className="w-full justify-start h-12"
            onClick={() => {
              action.onClick();
              onOpenChange(false);
            }}
            disabled={action.disabled}
          >
            {action.icon && (
              <span className="mr-3">{action.icon}</span>
            )}
            {action.label}
          </Button>
        ))}

        <div className="pt-2 border-t border-border">
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

// Menu bottom sheet
interface MenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function MenuSheet({
  open,
  onOpenChange,
  title,
  children
}: MenuSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      snapPoints={[0.6, 0.9]}
      contentClassName="p-4"
    >
      {children}
    </BottomSheet>
  );
}