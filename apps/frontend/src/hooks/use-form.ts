import type { FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { useFormState } from './use-form-state';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface FormField<T> {
  value: T;
  error?: string;
  onChange: (value: T) => void;
  onBlur?: () => void;
}

/**
 * Generic form hook that handles state, validation, and submission
 * Eliminates duplicate form logic across components
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const { loading, error, execute, clearError } = useFormState();

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [validate, values]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      clearError();

      if (!validateForm()) {
        return;
      }

      await execute(async () => onSubmit(values));
    },
    [values, onSubmit, validateForm, execute, clearError],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    clearError();
  }, [initialValues, clearError]);

  const getFieldProps = <K extends keyof T>(field: K): FormField<T[K]> => ({
    value: values[field],
    error: touched[field] ? errors[field] : undefined,
    onChange: (value: T[K]) => setValue(field, value),
    onBlur: () => setFieldTouched(field),
  });

  return {
    values,
    errors,
    touched,
    loading,
    error,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
  };
}
