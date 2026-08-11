export interface PasswordValidationResult {
  isValid: boolean;
  message: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const hasMinLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  let message = '';
  if (!password) {
    message = 'Password is required.';
  } else if (!hasMinLength) {
    message = 'Password must be at least 6 figures/characters in length.';
  } else if (!hasUpper) {
    message = 'Password must contain at least one uppercase letter (A-Z).';
  } else if (!hasLower) {
    message = 'Password must contain at least one lowercase letter (a-z).';
  } else if (!hasNumber) {
    message = 'Password must contain at least one number (0-9).';
  } else if (!hasSpecial) {
    message = 'Password must contain at least one special character (e.g. !@#$%^&*).';
  } else {
    message = 'Password satisfies all security requirements.';
  }

  return {
    isValid,
    message,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial
  };
};
