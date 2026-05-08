/**
 * Collection of validation helpers for forms and inputs.
 */

// Validates a required string is not empty or just whitespace
export const isRequired = (value: string | undefined | null): boolean => {
  if (value === undefined || value === null) return false;
  return value.trim().length > 0;
};

// Validates a string only contains letters and numbers
export const isAlphanumeric = (value: string): boolean => {
  return /^[a-zA-Z0-9]*$/.test(value);
};

// Validates profile name
export const validateProfileName = (name: string): { isValid: boolean; error?: string } => {
  if (!isRequired(name)) {
    return { isValid: false, error: 'Profile name is required' };
  }
  if (name.length > 50) {
    return { isValid: false, error: 'Profile name must be 50 characters or less' };
  }
  // Optional: Enforce no special characters, but let's allow spaces
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    return { isValid: false, error: 'Profile name can only contain letters, numbers, and spaces' };
  }
  
  return { isValid: true };
};
