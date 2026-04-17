/**
 * Validation utilities for phone numbers and passwords.
 * Used for live validation feedback in auth screens.
 */

export interface PhoneValidation {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
}

/**
 * Validate phone number format.
 * Allows: +{digits} or {digits only}, 10-20 chars
 */
export function validatePhone(phone: string): PhoneValidation {
  const errors: string[] = [];

  if (!phone) {
    return { isValid: false, errors: ['Phone number is required'] };
  }

  // Check if only digits and optional + prefix
  if (!/^\+?[0-9]*$/.test(phone)) {
    errors.push('Only digits and + prefix allowed');
  }

  // Remove + for length check
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    errors.push('Minimum 10 digits required');
  }

  if (digits.length > 20) {
    errors.push('Maximum 20 digits allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength.
 * Requirements: 8+ chars, uppercase, lowercase, digit
 */
export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasDigit;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
  };
}

/**
 * Check if email is valid (basic check).
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
