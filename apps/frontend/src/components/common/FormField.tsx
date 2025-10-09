import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  label: string;
  error?: string;
  hint?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
}

/**
 * Reusable form field component with label, input, error, and hint
 * Provides consistent styling and accessibility across all forms
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id, onChange, containerClassName, className, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={fieldId}>{label}</Label>
        <Input
          ref={ref}
          id={fieldId}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
