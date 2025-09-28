import { useForm, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema } from 'zod';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormValidationOptions<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  shouldFocusError?: boolean;
  onSubmit?: SubmitHandler<T>;
  onError?: (errors: any) => void;
  showToastOnError?: boolean;
  submitText?: string;
  submitErrorText?: string;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onBlur',
  reValidateMode = 'onChange',
  shouldFocusError = true,
  onSubmit,
  onError,
  showToastOnError = true,
  submitText = 'Submit',
  submitErrorText = 'Please fix the errors above'
}: UseFormValidationOptions<T>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
    shouldFocusError
  });

  const handleSubmit = useCallback(async (data: T) => {
    if (!onSubmit) return;

    setIsSubmitting(true);

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);

      if (showToastOnError) {
        toast({
          title: "Submission Failed",
          description: error instanceof Error ? error.message : "An error occurred while submitting the form",
          variant: "destructive",
        });
      }

      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onError, showToastOnError, toast]);

  const handleInvalidSubmit = useCallback((errors: any) => {
    console.warn('Form validation errors:', errors);

    if (showToastOnError) {
      toast({
        title: "Validation Error",
        description: submitErrorText,
        variant: "destructive",
      });
    }

    onError?.(errors);
  }, [onError, showToastOnError, submitErrorText, toast]);

  // Helper function to get field error message
  const getFieldError = useCallback((fieldName: keyof T): string | undefined => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  }, [form.formState.errors]);

  // Helper function to check if field has error
  const hasFieldError = useCallback((fieldName: keyof T): boolean => {
    return !!form.formState.errors[fieldName];
  }, [form.formState.errors]);

  // Helper function to get field validation state
  const getFieldState = useCallback((fieldName: keyof T) => {
    const error = form.formState.errors[fieldName];
    const isTouched = form.formState.touchedFields[fieldName];
    const isDirty = form.formState.dirtyFields[fieldName];

    return {
      error: error?.message as string | undefined,
      hasError: !!error,
      isTouched: !!isTouched,
      isDirty: !!isDirty,
      isValid: !error && isTouched
    };
  }, [form.formState.errors, form.formState.touchedFields, form.formState.dirtyFields]);

  // Helper function to validate single field
  const validateField = useCallback(async (fieldName: keyof T): Promise<boolean> => {
    const result = await form.trigger(fieldName as string);
    return result;
  }, [form]);

  // Helper function to validate all fields
  const validateForm = useCallback(async (): Promise<boolean> => {
    const result = await form.trigger();
    return result;
  }, [form]);

  // Helper function to reset form
  const resetForm = useCallback((values?: Partial<T>) => {
    form.reset(values);
  }, [form]);

  // Helper function to set field value
  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    form.setValue(fieldName as string, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  }, [form]);

  // Helper function to clear field error
  const clearFieldError = useCallback((fieldName: keyof T) => {
    form.clearErrors(fieldName as string);
  }, [form]);

  // Helper function to set field error
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    form.setError(fieldName as string, { message: error });
  }, [form]);

  return {
    // Form instance
    form,

    // Form state
    isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    touchedFields: form.formState.touchedFields,
    dirtyFields: form.formState.dirtyFields,

    // Submit handlers
    handleSubmit: form.handleSubmit(handleSubmit, handleInvalidSubmit),
    onSubmit: handleSubmit,

    // Field helpers
    getFieldError,
    hasFieldError,
    getFieldState,
    validateField,
    validateForm,
    resetForm,
    setFieldValue,
    clearFieldError,
    setFieldError,

    // Form methods (pass-through)
    register: form.register,
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    trigger: form.trigger,
    clearErrors: form.clearErrors,
    setError: form.setError,
    reset: form.reset
  };
}

// Specialized hooks for common forms
export function useLoginForm(onSubmit: SubmitHandler<{ email: string; password: string }>) {
  const { loginSchema } = await import('@/lib/validations');

  return useFormValidation({
    schema: loginSchema,
    onSubmit,
    submitText: 'Sign In',
    submitErrorText: 'Please check your email and password'
  });
}

export function useRegisterForm(onSubmit: SubmitHandler<any>) {
  const { registerSchema } = await import('@/lib/validations');

  return useFormValidation({
    schema: registerSchema,
    onSubmit,
    submitText: 'Create Account',
    submitErrorText: 'Please fix the errors and try again'
  });
}

export function useProfileForm(
  onSubmit: SubmitHandler<any>,
  defaultValues?: any
) {
  const { profileSchema } = await import('@/lib/validations');

  return useFormValidation({
    schema: profileSchema,
    defaultValues,
    onSubmit,
    submitText: 'Save Profile',
    submitErrorText: 'Please fix the errors before saving'
  });
}

export function usePasswordChangeForm(onSubmit: SubmitHandler<any>) {
  const { passwordChangeSchema } = await import('@/lib/validations');

  return useFormValidation({
    schema: passwordChangeSchema,
    onSubmit,
    submitText: 'Change Password',
    submitErrorText: 'Please check your passwords and try again'
  });
}

// Custom validation hook for real-time field validation
export function useFieldValidation<T>(
  value: T,
  validator: (value: T) => string | null,
  delay: number = 300
) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (val: T) => {
    setIsValidating(true);

    try {
      // Add delay for debouncing
      await new Promise(resolve => setTimeout(resolve, delay));

      const result = validator(val);
      setError(result);
    } catch (err) {
      setError('Validation error');
    } finally {
      setIsValidating(false);
    }
  }, [validator, delay]);

  // Validate whenever value changes
  useState(() => {
    if (value !== undefined && value !== null && value !== '') {
      validate(value);
    } else {
      setError(null);
      setIsValidating(false);
    }
  });

  return {
    error,
    isValidating,
    isValid: error === null && !isValidating,
    validate: () => validate(value)
  };
}