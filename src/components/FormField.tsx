import React from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

interface BaseFormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  showValidation?: boolean;
  validating?: boolean;
}

interface TextFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  maxLength?: number;
  showCharacterCount?: boolean;
  autoComplete?: string;
  showPasswordToggle?: boolean;
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  resize?: boolean;
}

interface SelectFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  emptyText?: string;
}

interface CheckboxFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  labelPosition?: 'left' | 'right';
}

interface SwitchFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  labelPosition?: 'left' | 'right';
}

// Text Input Field
export function TextField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  error,
  showValidation = true,
  validating,
  type = 'text',
  maxLength,
  showCharacterCount,
  autoComplete,
  showPasswordToggle
}: TextFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!error;
        const isValid = !hasError && fieldState.isTouched && field.value;

        return (
          <div className={cn('space-y-2', className)}>
            {label && (
              <Label htmlFor={field.name} className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}

            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={inputType}
                placeholder={placeholder}
                disabled={disabled || validating}
                maxLength={maxLength}
                autoComplete={autoComplete}
                className={cn(
                  'pr-8',
                  hasError && 'border-destructive focus-visible:ring-destructive',
                  isValid && showValidation && 'border-green-500 focus-visible:ring-green-500',
                  (isPassword && showPasswordToggle) && 'pr-16'
                )}
              />

              {/* Validation Icons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {validating && (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                )}

                {showValidation && !validating && (
                  <>
                    {hasError && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    {isValid && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </>
                )}

                {/* Password Toggle */}
                {isPassword && showPasswordToggle && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Character Count */}
            {showCharacterCount && maxLength && (
              <div className="text-xs text-muted-foreground text-right">
                {field.value?.length || 0}/{maxLength}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {description}
              </p>
            )}

            {/* Error Message */}
            {(fieldState.error || error) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

// Textarea Field
export function TextareaField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  error,
  showValidation = true,
  validating,
  rows = 3,
  maxLength,
  showCharacterCount,
  resize = true
}: TextareaFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!error;
        const isValid = !hasError && fieldState.isTouched && field.value;

        return (
          <div className={cn('space-y-2', className)}>
            {label && (
              <Label htmlFor={field.name} className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}

            <div className="relative">
              <Textarea
                {...field}
                id={field.name}
                placeholder={placeholder}
                disabled={disabled || validating}
                rows={rows}
                maxLength={maxLength}
                className={cn(
                  hasError && 'border-destructive focus-visible:ring-destructive',
                  isValid && showValidation && 'border-green-500 focus-visible:ring-green-500',
                  !resize && 'resize-none'
                )}
              />

              {/* Validation Icon */}
              {showValidation && !validating && (
                <div className="absolute right-2 top-2">
                  {hasError && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  {isValid && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )}

              {validating && (
                <div className="absolute right-2 top-2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              )}
            </div>

            {/* Character Count */}
            {showCharacterCount && maxLength && (
              <div className="text-xs text-muted-foreground text-right">
                {field.value?.length || 0}/{maxLength}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {description}
              </p>
            )}

            {/* Error Message */}
            {(fieldState.error || error) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

// Select Field
export function SelectField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  error,
  options,
  emptyText = 'No options available'
}: SelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!error;

        return (
          <div className={cn('space-y-2', className)}>
            {label && (
              <Label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}

            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  hasError && 'border-destructive focus:ring-destructive'
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                ) : (
                  options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {description}
              </p>
            )}

            {/* Error Message */}
            {(fieldState.error || error) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

// Checkbox Field
export function CheckboxField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  className,
  error,
  labelPosition = 'right'
}: CheckboxFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!error;

        return (
          <div className={cn('space-y-2', className)}>
            <div className={cn(
              'flex items-center space-x-2',
              labelPosition === 'left' && 'flex-row-reverse space-x-reverse'
            )}>
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                className={cn(
                  hasError && 'border-destructive'
                )}
              />
              {label && (
                <Label
                  htmlFor={field.name}
                  className={cn(
                    'text-sm font-medium cursor-pointer',
                    hasError && 'text-destructive'
                  )}
                >
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </Label>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {description}
              </p>
            )}

            {/* Error Message */}
            {(fieldState.error || error) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

// Switch Field
export function SwitchField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  className,
  error,
  labelPosition = 'left'
}: SwitchFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!error;

        return (
          <div className={cn('space-y-2', className)}>
            <div className={cn(
              'flex items-center justify-between',
              labelPosition === 'right' && 'flex-row-reverse justify-end space-x-2'
            )}>
              {label && (
                <Label
                  htmlFor={field.name}
                  className={cn(
                    'text-sm font-medium',
                    hasError && 'text-destructive'
                  )}
                >
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </Label>
              )}
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {description}
              </p>
            )}

            {/* Error Message */}
            {(fieldState.error || error) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}