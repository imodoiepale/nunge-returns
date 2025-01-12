import { fetchManufacturerDetails } from './manufacturerApi';

export function validatePIN(pin: string) {
  if (!pin) {
    return { isValid: false, error: 'PIN is required' };
  }

  // PIN should start with A or P and be followed by 10 digits
  const pinRegex = /^[AP]\d{10}$/;
  if (!pinRegex.test(pin)) {
    return { isValid: false, error: 'Invalid PIN format. PIN should start with A or P followed by 10 digits.' };
  }

  return { isValid: true, error: null };
}

export async function validatePassword(
  pin: string,
  password: string,
  setPasswordValidationStatus: (status: "idle" | "checking" | "invalid" | "valid") => void,
  setPasswordError: (error: string | null) => void
): Promise<boolean> {
  if (!password) {
    setPasswordError('Password is required');
    setPasswordValidationStatus("invalid");
    return false;
  }

  setPasswordValidationStatus("checking");

  try {
    // For now, we'll simulate password validation
    // In production, this should make a real API call to validate the password
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated validation - consider password valid if it's at least 8 characters
    const isValid = password.length >= 8;
    
    if (isValid) {
      setPasswordValidationStatus("valid");
      setPasswordError(null);
      return true;
    } else {
      setPasswordValidationStatus("invalid");
      setPasswordError('Invalid password. Password must be at least 8 characters long.');
      return false;
    }
  } catch (error) {
    setPasswordValidationStatus("invalid");
    setPasswordError('Failed to validate password. Please try again.');
    return false;
  }
}

export async function extractManufacturerDetails(pin: string) {
  try {
    // Extract first name from PIN (example logic - adjust based on your needs)
    const firstName = "John"; // This should be replaced with actual logic to get first name
    
    const details = await fetchManufacturerDetails(pin, firstName);
    return details;
  } catch (error) {
    console.error('Error extracting manufacturer details:', error);
    throw error;
  }
}

export async function resetPassword(pin: string): Promise<boolean> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

export async function resetPasswordAndEmail(pin: string): Promise<boolean> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error('Error resetting password and email:', error);
    return false;
  }
}

export async function fileNilReturn({ pin, password }: { pin: string; password: string }) {
  try {
    // Simulate filing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { status: "success" };
  } catch (error) {
    console.error('Error filing nil return:', error);
    return { status: "error", message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
