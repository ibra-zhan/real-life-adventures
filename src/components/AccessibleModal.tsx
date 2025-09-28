import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFocusManagement, useScreenReader } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface AccessibleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  returnFocus?: React.RefObject<HTMLElement>;
}

export function AccessibleModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  initialFocus,
  returnFocus
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { trapFocus, returnFocus: returnFocusTo } = useFocusManagement();
  const { announce } = useScreenReader();
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the element that was focused before opening the modal
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (!modalRef.current) return;

    if (open) {
      // Announce modal opening
      announce(`${title} dialog opened`);

      // Set up focus trap
      const cleanup = trapFocus(modalRef.current);

      // Focus initial element if specified, otherwise focus the modal
      if (initialFocus?.current) {
        initialFocus.current.focus();
      }

      return cleanup;
    } else {
      // Return focus when modal closes
      if (returnFocus?.current) {
        returnFocusTo(returnFocus.current);
      } else if (previousActiveElement.current) {
        returnFocusTo(previousActiveElement.current);
      }

      announce(`${title} dialog closed`);
    }
  }, [open, title, trapFocus, returnFocusTo, initialFocus, returnFocus, announce]);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <Dialog
      open={open}
      onOpenChange={closeOnOutsideClick ? onOpenChange : undefined}
    >
      <DialogContent
        ref={modalRef}
        className={cn(
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        onPointerDownOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle id="modal-title" className="text-lg font-semibold">
              {title}
            </DialogTitle>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                aria-label={`Close ${title} dialog`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {description && (
            <DialogDescription id="modal-description" className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Confirmation Modal with accessibility features
interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  // Focus the appropriate button based on variant
  const initialFocus = variant === 'destructive' ? cancelButtonRef : confirmButtonRef;

  return (
    <AccessibleModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      initialFocus={initialFocus}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 justify-end">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label={`${cancelText} - this will close the dialog without making changes`}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={`${confirmText} - this will perform the action and close the dialog`}
            aria-describedby="confirm-warning"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>

        {variant === 'destructive' && (
          <div id="confirm-warning" className="sr-only">
            Warning: This action cannot be undone
          </div>
        )}
      </div>
    </AccessibleModal>
  );
}